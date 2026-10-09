const db = require('../config/db');
const foodRequestModel = require('../models/foodRequestModel');
const foodPostModel = require('../models/foodPostModel');
const crypto = require('crypto');
const { uploadToSupabase } = require('../utils/supabaseStorage');
const captchaService = require('../utils/captchaService');

/**
 * Helper: Generate unique uppercase 6-digit alphanumeric pickup code (e.g. SM-849201)
 */
const generatePickupCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous characters like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SM-${code}`;
};

/**
 * FoodRequest Controller handles food requests submitted by receivers/NGOs
 */

const createFoodRequest = async (req, res, next) => {
  try {
    const {
      food_post_id,
      is_anonymous,
      requested_quantity,
      notes,
      payment_method,
      bkash_transaction_id,
      captchaId,
      captchaAnswer
    } = req.body;
    const receiver_id = req.user.id;

    // Verify CAPTCHA to prevent automated bot food claiming
    if (!captchaId || !captchaAnswer || !captchaService.verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({
        message: 'Security verification failed: Invalid or expired CAPTCHA code. Please complete the security challenge.'
      });
    }

    if (!food_post_id) {
      return res.status(400).json({ message: 'Food post ID is required' });
    }

    // Food seeker NID & Super Admin verification enforcement
    if (req.user.role === 'receiver') {
      const userRes = await db.query(
        'SELECT verification_status, nid, (nid_pdf IS NOT NULL) AS has_nid_pdf FROM users WHERE id = $1',
        [receiver_id]
      );
      const userRecord = userRes.rows[0];
      if (!userRecord || userRecord.verification_status !== 'verified') {
        return res.status(403).json({
          message: 'National ID (NID) verification required. You must upload your NID document in your Profile and wait for Super Admin verification before you can request food.'
        });
      }
    }

    // Verify food post exists
    const foodPost = await foodPostModel.getFoodPostById(food_post_id);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Prevent requesting own food post
    if (foodPost.donor_id === receiver_id) {
      return res.status(400).json({ message: 'You cannot request your own food post' });
    }

    const requestedQuantity = Number(requested_quantity || 1);
    const availableQuantity = Number(foodPost.quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: 'Requested portions must be a positive whole number.' });
    }
    if (Number.isFinite(availableQuantity) && requestedQuantity > availableQuantity) {
      return res.status(400).json({ message: `Only ${availableQuantity} portions are currently available.` });
    }

    const distributionTotal = Number(foodPost.distribution_total_amount) || 0;
    const distributionPackets = Number(foodPost.distribution_total_packets) || availableQuantity;
    const isFixedPaidDistribution = distributionTotal > 0 && distributionPackets > 0;
    let requestPaymentMethod = 'none';
    let paymentStatus = 'not_required';
    let paymentAmount = 0;
    let transactionId = null;
    let paymentBkashNumber = null;
    let ngoUserId = foodPost.distribution_ngo_user_id || null;

    // Keep a responsible NGO linked for verification, but never invent a wallet destination.
    if (!ngoUserId) {
      const ngoRes = await db.query("SELECT id FROM users WHERE role = 'ngo' ORDER BY id ASC LIMIT 1");
      if (ngoRes.rows.length > 0) {
        ngoUserId = ngoRes.rows[0].id;
      }
    }
    paymentBkashNumber = foodPost.distribution_bkash_number || null;

    const walletMethods = ['bkash', 'rocket', 'nagad'];
    if (walletMethods.includes(payment_method)) {
      requestPaymentMethod = payment_method;
      const walletNumbers = {
        bkash: foodPost.distribution_bkash_number,
        rocket: foodPost.distribution_rocket_number,
        nagad: foodPost.distribution_nagad_number
      };
      paymentBkashNumber = walletNumbers[payment_method];
      if (!paymentBkashNumber) {
        return res.status(400).json({ message: `This NGO has not configured its ${payment_method} wallet number for this distribution.` });
      }

      if (isFixedPaidDistribution) {
        paymentAmount = Number(((distributionTotal * requestedQuantity) / distributionPackets).toFixed(2));
      } else {
        paymentAmount = Number(req.body.payment_amount) || 20;
      }

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than 0 for mobile wallet payment.' });
      }

      transactionId = typeof bkash_transaction_id === 'string'
        ? bkash_transaction_id.trim().toUpperCase()
        : '';
      if (!/^[A-Z0-9]{6,20}$/.test(transactionId)) {
        return res.status(400).json({ message: 'Enter a valid mobile wallet Transaction ID (6 to 20 letters or numbers).' });
      }
      paymentStatus = 'verification_pending';
    } else if (payment_method === 'cash_on_delivery') {
      requestPaymentMethod = 'cash_on_delivery';
      if (isFixedPaidDistribution) {
        paymentAmount = Number(((distributionTotal * requestedQuantity) / distributionPackets).toFixed(2));
      } else {
        paymentAmount = Number(req.body.payment_amount) || 0;
      }
      paymentStatus = paymentAmount > 0 ? 'cod_due' : 'not_required';
    } else {
      if (isFixedPaidDistribution) {
        return res.status(400).json({ message: 'This food distribution requires Cash on Delivery or a configured mobile wallet payment.' });
      }
      requestPaymentMethod = 'none';
      paymentStatus = 'not_required';
      paymentAmount = 0;
    }

    // Check if receiver already has an active or completed request for this post
    const existing = await foodRequestModel.findExistingRequest(food_post_id, receiver_id);
    if (existing) {
      const errorMsg = existing.status === 'fulfilled'
        ? 'You have already received food from this donation post. Each recipient is limited to one claim per donation.'
        : 'You already have an active request for this food post.';
      return res.status(400).json({
        message: errorMsg,
        data: existing
      });
    }

    // Generate unique pickup code
    let pickupCode = generatePickupCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const codeCheck = await foodRequestModel.findByPickupCode(pickupCode);
      if (!codeCheck) {
        isUnique = true;
      } else {
        pickupCode = generatePickupCode();
        attempts++;
      }
    }

    const newRequest = await foodRequestModel.createFoodRequest({
      food_post_id,
      receiver_id,
      is_anonymous: Boolean(is_anonymous),
      pickup_code: pickupCode,
      requested_quantity: requestedQuantity,
      notes: notes || '',
      payment_method: requestPaymentMethod,
      payment_amount: paymentAmount,
      payment_status: paymentStatus,
      bkash_transaction_id: transactionId,
      payment_bkash_number: paymentBkashNumber,
      ngo_user_id: ngoUserId
    });

    // Ensure food_posts links to this NGO
    if (ngoUserId && !foodPost.distribution_ngo_user_id && requestPaymentMethod === 'bkash') {
      await db.query(
        `UPDATE food_posts 
         SET distribution_ngo_user_id = $1, 
             distribution_bkash_number = COALESCE(distribution_bkash_number, $2)
         WHERE id = $3`,
        [ngoUserId, paymentBkashNumber, food_post_id]
      );
    }

    // Send notification to the NGO about incoming payment
    if (walletMethods.includes(requestPaymentMethod) && ngoUserId) {
      try {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, link, metadata)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [
            ngoUserId,
            `New ${requestPaymentMethod} Payment Received`,
            `Receiver submitted ${paymentAmount} via ${requestPaymentMethod} (Txn ID: ${transactionId}) for ${requestedQuantity} portions of "${foodPost.food_name || foodPost.title}". Please verify.`,
            'mobile_wallet_payment_received',
            '/ngo/requests',
            JSON.stringify({ food_request_id: newRequest.id, payment_amount: paymentAmount, payment_method: requestPaymentMethod, transaction_id: transactionId })
          ]
        );
      } catch (notifErr) {
        console.error('Error sending NGO payment notification:', notifErr);
      }
    }

    return res.status(201).json({
      message: 'Food request submitted successfully!',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

const getMyFoodRequests = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const requests = await foodRequestModel.findByReceiverId(receiverId);
    return res.status(200).json({
      message: 'Food requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

const getIncomingFoodRequests = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let requests;
    if (userRole === 'ngo' || userRole === 'admin' || userRole === 'super_admin') {
      const ngoUserId = userRole === 'ngo' ? (req.user.parent_ngo_id || req.user.id) : null;
      requests = await foodRequestModel.findIncomingForNgo(ngoUserId);
    } else {
      requests = await foodRequestModel.findIncomingForDonor(req.user.id);
    }
    return res.status(200).json({
      message: 'Incoming food requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

const updateFoodRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['requested', 'approved', 'fulfilled', 'rejected', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }

    const existingRequest = await foodRequestModel.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: 'Food request not found' });
    }

    // Auth check: donor, receiver, ngo, or super_admin
    const userId = req.user.id;
    const userRole = req.user.role;
    const isDonor = existingRequest.donor_id === userId;
    const isReceiver = existingRequest.receiver_id === userId;
    const isNgo = userRole === 'ngo';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';

    if (!isDonor && !isReceiver && !isAdmin && !isNgo) {
      return res.status(403).json({ message: 'Not authorized to update this food request' });
    }

    if (
      status === 'approved' &&
      ['bkash', 'rocket', 'nagad'].includes(existingRequest.payment_method) &&
      existingRequest.payment_status !== 'paid'
    ) {
      return res.status(409).json({
        message: 'Verify the receiver’s bKash payment before approving this request.'
      });
    }

    if (
      status === 'fulfilled' &&
      Number(existingRequest.payment_amount) > 0 &&
      existingRequest.payment_status !== 'paid'
    ) {
      return res.status(409).json({
        message: 'Confirm payment collection before completing this food handover.'
      });
    }

    // When distributor/NGO accepts request ('approved'), validate remaining quantity for this food post
    if (status === 'approved') {
      const collRes = await db.query(
        `SELECT remaining_packets, total_packets, status 
         FROM food_requests 
         WHERE food_post_id = $1 AND remaining_packets IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [existingRequest.food_post_id]
      );
      
      let availableQuantity = null;
      if (collRes.rows[0] && collRes.rows[0].remaining_packets != null) {
        availableQuantity = collRes.rows[0].remaining_packets;
      } else {
        const postRes = await db.query(
          `SELECT quantity, food_name, title FROM food_posts WHERE id = $1`,
          [existingRequest.food_post_id]
        );
        if (postRes.rows[0]) {
          availableQuantity = postRes.rows[0].quantity;
        }
      }

      const foodName = existingRequest.food_name || existingRequest.food_title || 'this food';
      const requestedQty = existingRequest.requested_quantity || 1;

      if (availableQuantity != null && availableQuantity <= 0) {
        return res.status(400).json({
          message: `❌ Cannot accept request: "${foodName}" is completely out of stock (0 portions remaining).`
        });
      }

      if (availableQuantity != null && requestedQty > availableQuantity) {
        return res.status(400).json({
          message: `❌ Cannot accept request: Food seeker requested ${requestedQty} portions, but only ${availableQuantity} portions remain available for "${foodName}".`
        });
      }
    }

    const updatedRequest = await foodRequestModel.updateStatus(id, status);
    return res.status(200).json({
      message: `Food request status updated to ${status}`,
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

const verifyPickupCode = async (req, res, next) => {
  try {
    const { pickup_code, food_post_id, collection_id } = req.body;
    if (!pickup_code) {
      return res.status(400).json({ message: 'Pickup code is required' });
    }

    const cleanCode = pickup_code.trim().toUpperCase();
    const request = await foodRequestModel.findByPickupCode(cleanCode);
    if (!request) {
      return res.status(404).json({ message: `Invalid pickup code "${cleanCode}". No matching request found.` });
    }

    // Auth check: post owner, ngo staff, or super admin
    const userId = req.user.id;
    const userRole = req.user.role;
    const isOwner = request.donor_id === userId;
    const isNgo = userRole === 'ngo';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';

    if (!isOwner && !isAdmin && !isNgo) {
      return res.status(403).json({ message: 'Not authorized to verify pickup code for this food post' });
    }

    if (request.status === 'fulfilled') {
      return res.status(400).json({ message: `This pickup code (${cleanCode}) has already been used and fulfilled.` });
    }

    // Scoping check - if food_post_id or collection_id was specified, ensure code matches this specific food post!
    let targetFoodPostId = food_post_id ? parseInt(food_post_id, 10) : null;
    let targetFoodName = null;
    let targetRemaining = null;

    if (collection_id) {
      const collRes = await db.query(
        `SELECT fr.food_post_id, fr.remaining_packets, fp.food_name, fp.title 
         FROM food_requests fr
         JOIN food_posts fp ON fr.food_post_id = fp.id
         WHERE fr.id = $1`,
        [collection_id]
      );
      if (collRes.rows[0]) {
        targetFoodPostId = collRes.rows[0].food_post_id;
        targetFoodName = collRes.rows[0].food_name || collRes.rows[0].title;
        targetRemaining = collRes.rows[0].remaining_packets;
      }
    } else if (targetFoodPostId) {
      const postRes = await db.query(`SELECT food_name, title, quantity FROM food_posts WHERE id = $1`, [targetFoodPostId]);
      if (postRes.rows[0]) {
        targetFoodName = postRes.rows[0].food_name || postRes.rows[0].title;
        targetRemaining = postRes.rows[0].quantity;
      }
    }

    if (targetFoodPostId && request.food_post_id !== targetFoodPostId) {
      const codeFoodName = request.food_name || request.food_title || 'another food post';
      return res.status(400).json({
        message: `❌ Food Mismatch: This pickup code was generated for "${codeFoodName}", NOT for "${targetFoodName || 'this food'}". Each pickup code only works for the specific food requested.`
      });
    }

    // Quantity check against remaining stock
    const requestedQty = request.requested_quantity || 1;
    if (targetRemaining != null && requestedQty > targetRemaining) {
      return res.status(400).json({
        valid: false,
        insufficient_quantity: true,
        message: `❌ Insufficient Quantity: Food seeker requested ${requestedQty} packets, but only ${targetRemaining} packets remain available for this food.`
      });
    }

    if (request.status === 'rejected' || request.status === 'cancelled') {
      return res.status(400).json({
        valid: false,
        message: `This pickup code (${cleanCode}) belongs to a request that has been ${request.status}.`
      });
    }

    // Code verification ONLY validates and verifies the code. It does NOT complete the pickup / mark fulfilled.
    return res.status(200).json({
      valid: true,
      verified: true,
      message: `✓ Valid Pickup Code: "${cleanCode}" for ${request.receiver_name || 'Receiver'} (${requestedQty} portion${requestedQty > 1 ? 's' : ''} of "${request.food_name || request.food_title || 'Food'}"). Status: ${request.status.toUpperCase()}.`,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

const uploadReceiptPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await foodRequestModel.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Food request not found' });
    }

    // Check authorization: receiver or donor or admin
    const userId = req.user.id;
    const userRole = req.user.role;
    if (request.receiver_id !== userId && request.donor_id !== userId && userRole !== 'super_admin' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to upload proof of receipt for this request' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a proof of receipt image file' });
    }

    const receiptPhotoUrl = await uploadToSupabase(req.file, 'receipt-photos');
    const updatedRequest = await foodRequestModel.updateReceiptPhoto(id, receiptPhotoUrl);

    return res.status(200).json({
      message: '📷 Proof of receipt photo uploaded successfully!',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * NGO creates a pickup request for a donor's food post
 * Status is set to 'pickup_requested' so donor can see it
 */
const createNgoPickupRequest = async (req, res, next) => {
  try {
    const { food_post_id, notes, captchaId, captchaAnswer } = req.body;
    const ngoUserId = req.user.id;

    // Verify CAPTCHA to prevent automated bot requests
    if (!captchaId || !captchaAnswer || !captchaService.verifyCaptcha(captchaId, captchaAnswer)) {
      return res.status(400).json({
        message: 'Security verification failed: Invalid or expired CAPTCHA code. Please complete the security challenge.'
      });
    }

    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only NGOs can create pickup requests' });
    }
    if (!food_post_id) {
      return res.status(400).json({ message: 'Food post ID is required' });
    }

    const foodPost = await foodPostModel.getFoodPostById(food_post_id);
    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }
    if (foodPost.donor_id === ngoUserId) {
      return res.status(400).json({ message: 'Cannot request pickup from your own post' });
    }

    // Check for existing pending pickup request from this NGO for this post
    const existing = await foodRequestModel.findExistingRequest(food_post_id, ngoUserId);
    if (existing) {
      return res.status(400).json({ message: 'You already have an active pickup request for this food post' });
    }

    // Generate a pickup code
    let pickupCode = generatePickupCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const codeCheck = await foodRequestModel.findByPickupCode(pickupCode);
      if (!codeCheck) { isUnique = true; } else { pickupCode = generatePickupCode(); attempts++; }
    }

    const newRequest = await foodRequestModel.createFoodRequest({
      food_post_id,
      receiver_id: ngoUserId,
      is_anonymous: false,
      pickup_code: pickupCode,
      requested_quantity: foodPost.quantity || 1,
      notes: notes || 'NGO Pickup Request'
    });

    // Manually set to pickup_requested status
    const updated = await foodRequestModel.updateStatus(newRequest.id, 'pickup_requested');

    return res.status(201).json({
      message: 'Pickup request sent to donor successfully!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Donor fetches all NGO pickup requests for their posts
 */
const getDonorPickupRequests = async (req, res, next) => {
  try {
    const donorId = req.user.id;
    const requests = await foodRequestModel.findPickupRequestsForDonor(donorId);
    return res.status(200).json({
      message: 'NGO pickup requests retrieved',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * NGO fetches all pickup requests they have sent
 */
const getNgoPickupRequests = async (req, res, next) => {
  try {
    const ngoUserId = req.user.id;
    const requests = await foodRequestModel.findPickupRequestsByNgo(ngoUserId);
    return res.status(200).json({
      message: 'NGO sent pickup requests retrieved',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Donor responds to an NGO pickup request: accept or reject
 */
const respondToPickupRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const donorId = req.user.id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "accept" or "reject"' });
    }

    const existingRequest = await foodRequestModel.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }
    if (existingRequest.donor_id !== donorId) {
      return res.status(403).json({ message: 'Not authorized to respond to this pickup request' });
    }
    if (existingRequest.status !== 'pickup_requested') {
      return res.status(400).json({ message: `Cannot respond: request status is "${existingRequest.status}"` });
    }

    let updatedRequest;
    if (action === 'accept') {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        const updateResult = await client.query(
          `UPDATE food_requests
           SET status = 'approved', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND status = 'pickup_requested'
           RETURNING *;`,
          [id]
        );

        if (updateResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            message: 'This pickup request has already been responded to.'
          });
        }

        updatedRequest = updateResult.rows[0];
        const foodName = existingRequest.food_name || existingRequest.food_title || 'your requested food';
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, link, metadata)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb);`,
          [
            existingRequest.receiver_id,
            '✅ Donor Accepted Your Pickup Request',
            `The donor approved your pickup request for ${foodName}. You can now arrange collection.`,
            'ngo_pickup_approved',
            '/ngo/incoming',
            JSON.stringify({ food_request_id: Number(id), food_post_id: existingRequest.food_post_id })
          ]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      updatedRequest = await foodRequestModel.updateStatus(id, 'rejected');
    }

    return res.status(200).json({
      message: action === 'accept'
        ? '✅ Pickup request accepted! NGO can now collect the food.'
        : '❌ Pickup request rejected.',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign receiving staff member to an approved pickup request
 */
const assignReceivingStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;
    if (!staff_id) {
      return res.status(400).json({ message: 'Staff ID is required to assign pickup.' });
    }
    const updated = await foodRequestModel.assignReceivingStaff(id, staff_id);
    return res.status(200).json({
      message: 'Receiving staff assigned successfully!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Receiving staff (or NGO Admin) marks food as picked up from donor
 */
const markPickedUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await foodRequestModel.findById(id);
    // Use explicitly passed staff_id, or the assigned receiving staff, or req.user.id
    const staffId = req.body?.staff_id || existing?.assigned_staff_id || req.user.id;
    const updated = await foodRequestModel.markPickedUp(id, staffId);
    return res.status(200).json({
      message: 'Donation marked as picked up!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Distributor staff (or NGO Admin) inspects food and marks as received at hub
 */
const markAtHub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.body?.staff_id || req.user.id;
    const updated = await foodRequestModel.markAtHub(id, staffId);
    return res.status(200).json({
      message: 'Food verified and received at Hub!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Distributor staff (or NGO Admin) posts food for distribution to receivers
 */
const postDistributing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pickup_point_id, total_packets, needs_options, total_amount, bkash_number, rocket_number, nagad_number } = req.body;
    const ngoUserId = req.user.parent_ngo_id || req.user.id;
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only an NGO account can post food for distribution.' });
    }
    const packetCount = Number(total_packets);
    const totalAmount = Number(total_amount || 0);
    const normalizedBkashNumber = typeof bkash_number === 'string'
      ? bkash_number.replace(/[\s-]/g, '')
      : '';
    const normalizedRocketNumber = typeof rocket_number === 'string' ? rocket_number.replace(/[\s-]/g, '') : '';
    const normalizedNagadNumber = typeof nagad_number === 'string' ? nagad_number.replace(/[\s-]/g, '') : '';
    const validWalletNumber = (number) => /^(?:\+?88)?01[3-9]\d{8}$/.test(number);
    if (!pickup_point_id || !Number.isInteger(packetCount) || packetCount < 1) {
      return res.status(400).json({ message: 'Pickup point and a positive whole packet count are required.' });
    }
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ message: 'The total amount must be zero or a positive number.' });
    }
    if (totalAmount > 0 && ![normalizedBkashNumber, normalizedRocketNumber, normalizedNagadNumber].some(validWalletNumber)) {
      return res.status(400).json({ message: 'Add at least one valid Bangladesh bKash, Rocket, or Nagad wallet number for paid distribution.' });
    }
    if ([normalizedBkashNumber, normalizedRocketNumber, normalizedNagadNumber].some((number) => number && !validWalletNumber(number))) {
      return res.status(400).json({ message: 'Check the bKash, Rocket, and Nagad wallet numbers. Use a valid Bangladesh mobile number.' });
    }
    const updated = await foodRequestModel.postForDistribution(id, {
      pickup_point_id,
      total_packets: packetCount,
      needs_options,
      total_amount: totalAmount,
      bkash_number: normalizedBkashNumber || null,
      rocket_number: normalizedRocketNumber || null,
      nagad_number: normalizedNagadNumber || null,
      ngo_user_id: ngoUserId
    });
    if (!updated) {
      return res.status(404).json({ message: 'The hub request was not found or does not belong to your NGO.' });
    }
    return res.status(200).json({
      message: 'Food posted for distribution successfully!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const updateDistributionWallets = async (req, res, next) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only NGO accounts can configure distribution wallets.' });
    }
    const normalize = (value) => typeof value === 'string' ? value.replace(/[\s-]/g, '') : '';
    const bkash_number = normalize(req.body.bkash_number);
    const rocket_number = normalize(req.body.rocket_number);
    const nagad_number = normalize(req.body.nagad_number);
    const valid = (number) => /^(?:\+?88)?01[3-9]\d{8}$/.test(number);
    const numbers = [bkash_number, rocket_number, nagad_number];
    if (numbers.some((number) => number && !valid(number))) {
      return res.status(400).json({ message: 'Use a valid Bangladesh mobile wallet number for each provider.' });
    }
    if (!numbers.some(Boolean)) {
      return res.status(400).json({ message: 'Add at least one wallet number before enabling payment options.' });
    }
    const ngo_user_id = req.user.parent_ngo_id || req.user.id;
    const updated = await foodRequestModel.updateDistributionWallets(req.params.id, {
      bkash_number: bkash_number || null,
      rocket_number: rocket_number || null,
      nagad_number: nagad_number || null,
      ngo_user_id
    });
    if (!updated) return res.status(404).json({ message: 'Distributing food was not found for your NGO.' });
    return res.status(200).json({ message: 'Payment wallet numbers updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

const updateFoodPayment = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (action === 'resubmit_bkash' || action === 'resubmit_wallet_payment') {
      if (req.user.role !== 'receiver') {
        return res.status(403).json({ message: 'Only the receiver who submitted the request can replace its bKash Transaction ID.' });
      }
      const transactionId = typeof req.body.bkash_transaction_id === 'string'
        ? req.body.bkash_transaction_id.trim().toUpperCase()
        : '';
      if (!/^[A-Z0-9]{6,20}$/.test(transactionId)) {
        return res.status(400).json({ message: 'Enter a valid bKash Transaction ID (6–20 letters or numbers).' });
      }
      const updated = await foodRequestModel.resubmitBikashTransaction(req.params.id, req.user.id, transactionId);
      if (!updated) {
        return res.status(409).json({ message: 'This payment is not awaiting a corrected bKash Transaction ID.' });
      }
      return res.status(200).json({ message: 'Transaction ID resubmitted for NGO verification.', data: updated });
    }

    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only the responsible NGO can verify or collect this payment.' });
    }
    const paymentStatuses = {
      verify_bkash: 'paid',
      reject_bkash: 'rejected',
      verify_wallet_payment: 'paid',
      reject_wallet_payment: 'rejected',
      confirm_cash: 'paid'
    };
    const paymentStatus = paymentStatuses[action];
    if (!paymentStatus) {
      return res.status(400).json({ message: 'Choose a valid payment action.' });
    }
    const ngoUserId = req.user.parent_ngo_id || req.user.id;
    const updated = await foodRequestModel.updatePaymentStatus(req.params.id, ngoUserId, paymentStatus);
    if (!updated) {
      return res.status(409).json({
        message: 'Payment was already processed or this request is not assigned to your NGO.'
      });
    }
    return res.status(200).json({
      message: paymentStatus === 'rejected' ? 'Mobile wallet transaction marked as unverified.' : 'Payment confirmed.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Distributor staff (or NGO Admin) hands over packets to receiver
/**
 * Look up a receiver's pickup code to verify and auto-populate beneficiary details
 */
const lookupPickupCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { food_post_id, collection_id } = req.query;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Pickup code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const request = await foodRequestModel.findByPickupCode(cleanCode);

    if (!request) {
      return res.status(404).json({
        valid: false,
        message: `Invalid pickup code "${cleanCode}". No matching receiver request found in system.`
      });
    }

    if (request.status === 'fulfilled') {
      return res.status(400).json({
        valid: false,
        already_fulfilled: true,
        message: `This pickup code (${cleanCode}) has already been fulfilled and collected.`
      });
    }

    // Resolve target food post and remaining quantity
    let targetFoodPostId = food_post_id ? parseInt(food_post_id, 10) : null;
    let targetFoodName = null;
    let targetRemainingPackets = null;

    if (collection_id) {
      const collRes = await require('../config/db').query(
        `SELECT fr.id, fr.food_post_id, fr.remaining_packets, fp.food_name, fp.title 
         FROM food_requests fr
         JOIN food_posts fp ON fr.food_post_id = fp.id
         WHERE fr.id = $1`,
        [collection_id]
      );
      if (collRes.rows[0]) {
        targetFoodPostId = collRes.rows[0].food_post_id;
        targetFoodName = collRes.rows[0].food_name || collRes.rows[0].title;
        targetRemainingPackets = collRes.rows[0].remaining_packets;
      }
    } else if (targetFoodPostId) {
      const postRes = await require('../config/db').query(
        `SELECT id, food_name, title FROM food_posts WHERE id = $1`,
        [targetFoodPostId]
      );
      if (postRes.rows[0]) {
        targetFoodName = postRes.rows[0].food_name || postRes.rows[0].title;
      }
    }

    // Rule 1: Code must only work for the specific food post requested!
    if (targetFoodPostId && request.food_post_id !== targetFoodPostId) {
      const requestedFoodName = request.food_name || request.food_title || request.food_type || 'another food post';
      return res.status(400).json({
        valid: false,
        food_mismatch: true,
        message: `❌ Food Mismatch: This pickup code was generated for "${requestedFoodName}", NOT for "${targetFoodName || 'this food'}". Each pickup code only works for the specific food requested.`
      });
    }

    // Rule 2: Check if requested quantity exceeds remaining available packets
    const requestedQty = request.requested_quantity || 1;
    if (targetRemainingPackets != null && targetRemainingPackets < requestedQty) {
      return res.status(400).json({
        valid: false,
        insufficient_quantity: true,
        requested_quantity: requestedQty,
        remaining_packets: targetRemainingPackets,
        message: `❌ Insufficient Quantity: Food seeker requested ${requestedQty} packets, but only ${targetRemainingPackets} packets remain available for this food.`
      });
    }

    return res.status(200).json({
      valid: true,
      message: `✓ Validated for "${request.food_name || request.food_title || 'This Food'}": ${request.receiver_name} (${requestedQty} portions requested)`,
      data: {
        id: request.id,
        food_post_id: request.food_post_id,
        food_name: request.food_name || request.food_title,
        food_type: request.food_type,
        receiver_id: request.receiver_id,
        receiver_name: request.receiver_name,
        receiver_phone: request.receiver_phone,
        requested_quantity: requestedQty,
        remaining_packets: targetRemainingPackets,
        status: request.status,
        pickup_code: request.pickup_code
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * NGO / Distributor hands over a specific number of food packets to a beneficiary
 * Requires a verified matching receiver pickup code for the specific food post and matching quantity.
 */
const handoverPackets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { receiver_name, receiver_phone, quantity, pickup_code } = req.body;
    const staff_id = req.user.id;
    const staff_name = req.user.name || 'NGO Staff';

    if (!pickup_code || !pickup_code.trim()) {
      return res.status(400).json({
        message: 'Receiver pickup code is required. Without a valid matching code, food cannot be handed over.'
      });
    }

    // Fetch the target collection / distribution item
    const collRes = await require('../config/db').query(
      `SELECT fr.id, fr.food_post_id, fr.remaining_packets, fp.food_name, fp.title
       FROM food_requests fr
       JOIN food_posts fp ON fr.food_post_id = fp.id
       WHERE fr.id = $1`,
      [id]
    );
    if (!collRes.rows[0]) {
      return res.status(404).json({ message: 'Collection / distribution record not found' });
    }
    const targetColl = collRes.rows[0];

    const cleanCode = pickup_code.trim().toUpperCase();
    const matchedReceiverReq = await foodRequestModel.findByPickupCode(cleanCode);

    if (!matchedReceiverReq) {
      return res.status(400).json({
        message: `Invalid pickup code "${cleanCode}". Without a valid matching code, food cannot be handed over.`
      });
    }

    if (matchedReceiverReq.status === 'fulfilled') {
      return res.status(400).json({
        message: `This pickup code (${cleanCode}) has already been fulfilled and collected.`
      });
    }

    // Rule 1: Pickup code must match the specific food post being distributed!
    if (matchedReceiverReq.food_post_id !== targetColl.food_post_id) {
      const codeFoodName = matchedReceiverReq.food_name || matchedReceiverReq.food_title || matchedReceiverReq.food_type || 'another food post';
      const currentFoodName = targetColl.food_name || targetColl.title || 'this food';
      return res.status(400).json({
        message: `❌ Food Post Mismatch: This pickup code (${cleanCode}) was generated for "${codeFoodName}", NOT for "${currentFoodName}". Pickup codes only work for the specific food requested.`
      });
    }

    // Rule 2: Quantity must match remaining quantity
    const qty = parseInt(quantity, 10) || matchedReceiverReq.requested_quantity || 1;
    const remainingStock = targetColl.remaining_packets ?? 0;

    if (remainingStock <= 0) {
      return res.status(400).json({
        message: `❌ Out of Stock: All packets for "${targetColl.food_name || targetColl.title}" have already been distributed.`
      });
    }

    if (qty > remainingStock) {
      return res.status(400).json({
        message: `❌ Quantity Exceeds Remaining Stock: Requested ${qty} packets, but only ${remainingStock} packets remain available for this food.`
      });
    }

    const finalReceiverName = (receiver_name && receiver_name.trim()) || matchedReceiverReq.receiver_name || 'Receiver';
    const finalReceiverPhone = (receiver_phone && receiver_phone.trim()) || matchedReceiverReq.receiver_phone || 'N/A';

    const updated = await foodRequestModel.handoverPackets(id, {
      receiver_name: finalReceiverName,
      receiver_phone: finalReceiverPhone,
      quantity: qty,
      pickup_code: cleanCode,
      staff_id,
      staff_name
    });

    if (!updated) {
      return res.status(404).json({ message: 'Failed to update distribution record' });
    }

    // Mark matched receiver request as fulfilled
    try {
      await foodRequestModel.updateStatus(matchedReceiverReq.id, 'fulfilled');
    } catch (errFulfill) {
      console.error('Failed to mark individual receiver request fulfilled:', errFulfill.message);
    }

    // Log in serving logs
    try {
      const ngoId = req.user.parent_ngo_id || req.user.id;
      const ngoRes = await require('../config/db').query('SELECT id FROM ngos WHERE user_id = $1 LIMIT 1', [ngoId]);
      if (ngoRes.rows[0]) {
        await require('../models/servingLogModel').createServingLog({
          ngo_id: ngoRes.rows[0].id,
          donation_ref: updated.food_post_id ? `DON-${updated.food_post_id}` : null,
          meals_served: qty,
          location: 'NGO Distribution Hub',
          notes: `Handed over ${qty} meals to ${finalReceiverName} (Code: ${cleanCode}) by ${staff_name}`
        });
      }
    } catch (logErr) {
      console.error('Serving log auto-insert error:', logErr.message);
    }

    return res.status(200).json({
      message: `Successfully handed over ${qty} packets! Remaining: ${updated.remaining_packets}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFoodRequest,
  getMyFoodRequests,
  getIncomingFoodRequests,
  updateFoodRequestStatus,
  verifyPickupCode,
  lookupPickupCode,
  uploadReceiptPhoto,
  createNgoPickupRequest,
  getDonorPickupRequests,
  getNgoPickupRequests,
  respondToPickupRequest,
  assignReceivingStaff,
  markPickedUp,
  markAtHub,
  postDistributing,
  updateDistributionWallets,
  handoverPackets,
  updateFoodPayment
};
