const db = require('../config/db');
const notificationModel = require('../models/notificationModel');
const { formatTimeAgo, formatFullDate, buildPostLifecycleThread } = require('../utils/threadHelper');

/**
 * Enhanced Notification Controller handles fetching and managing role-based
 * in-app notifications, lifecycle threads, staff progress bars, and seeker review buttons.
 */

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const staffRole = (req.user.ngo_staff_role || '').toLowerCase();

    const notifications = [];

    // Helper for staff 5-stage progress bar
    const buildStaffProgressBar = (r) => {
      let currentStep = 1;
      let currentLabel = 'Food Request Accepted by Donor';

      const isDistributing = (r.total_packets != null && r.total_packets > 0) || (Array.isArray(r.distribution_logs) && r.distribution_logs.length > 0);
      const isAtHub = !!r.received_at_hub_at;
      const isPickedUp = !!r.picked_up_at;
      const isAssigned = !!r.assigned_staff_id;

      if (isDistributing) {
        currentStep = 5;
        currentLabel = 'Distributing';
      } else if (isAtHub) {
        currentStep = 4;
        currentLabel = 'At NGO Hub';
      } else if (isPickedUp) {
        currentStep = 3;
        currentLabel = 'Picked Up';
      } else if (isAssigned) {
        currentStep = 2;
        currentLabel = 'Receiving Staff Assigned';
      }

      return {
        current_step: currentStep,
        current_label: currentLabel,
        stages: [
          { step: 1, key: 'accepted_by_donor', label: 'Accepted by Donor', completed: true },
          { step: 2, key: 'staff_assigned', label: 'Receiving Staff Assigned', completed: isAssigned || isPickedUp || isAtHub || isDistributing },
          { step: 3, key: 'picked_up', label: 'Picked Up', completed: isPickedUp || isAtHub || isDistributing },
          { step: 4, key: 'at_hub', label: 'At NGO Hub', completed: isAtHub || isDistributing },
          { step: 5, key: 'distributing', label: 'Distributing', completed: isDistributing }
        ]
      };
    };

    // 1. Persistent database notifications (e.g. approved password reset links, system alerts)
    try {
      const dbNotifsRes = await db.query(
        `SELECT id, user_id, title, message, type, link, metadata, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY id DESC LIMIT 20;`,
        [userId]
      );

      for (const dbN of dbNotifsRes.rows) {
        notifications.push({
          id: `db_${dbN.id}`,
          notification_id: dbN.id,
          type: dbN.type || 'system_notification',
          title: dbN.title || 'Notification',
          subtitle: dbN.message,
          message: dbN.message,
          link: dbN.link,
          metadata: dbN.metadata,
          time: formatTimeAgo(dbN.created_at),
          timestamp: new Date(dbN.created_at).getTime(),
          unread: !dbN.is_read,
          is_read: Boolean(dbN.is_read)
        });
      }
    } catch (dbNotifErr) {
      console.warn('Could not fetch DB notifications:', dbNotifErr.message);
    }

    // 2. Role-specific realtime synthesized feed

    // ==========================================
    // ROLE: DONOR
    // ==========================================
    if (userRole === 'donor') {
      const donorFoodRes = await db.query(
        `SELECT 
          f.id AS post_id,
          f.food_name,
          f.title,
          f.food_type,
          f.quantity AS initial_quantity,
          f.district,
          f.thana,
          f.area_ward,
          f.road_no,
          f.house_no,
          f.floor_flat,
          f.created_at AS post_created_at,
          u.id AS donor_id,
          u.name AS donor_name,
          u.phone AS donor_phone,
          u.email AS donor_email,
          ngo_req.id AS ngo_request_id,
          ngo_req.status AS ngo_request_status,
          ngo_req.created_at AS ngo_requested_at,
          ngo_user.id AS ngo_user_id,
          ngo_user.name AS ngo_user_name,
          ngo_user.phone AS ngo_user_phone,
          ngo_org.organization_name AS ngo_organization_name,
          assigned_staff.id AS assigned_staff_id,
          assigned_staff.name AS assigned_staff_name,
          assigned_staff.phone AS assigned_staff_phone,
          picked_staff.name AS picked_up_staff_name,
          picked_staff.phone AS picked_up_staff_phone,
          ngo_req.picked_up_at,
          hub_staff.name AS hub_staff_name,
          hub_staff.phone AS hub_staff_phone,
          ngo_req.received_at_hub_at,
          pp.id AS pickup_point_id,
          pp.name AS pickup_point_name,
          pp.address AS pickup_point_address,
          ngo_req.total_packets,
          ngo_req.remaining_packets,
          ngo_req.distribution_logs
        FROM food_posts f
        JOIN users u ON f.donor_id = u.id
        LEFT JOIN LATERAL (
          SELECT fr_sub.* FROM food_requests fr_sub
          JOIN users u_ngo ON fr_sub.receiver_id = u_ngo.id
          WHERE fr_sub.food_post_id = f.id AND u_ngo.role = 'ngo'
          ORDER BY fr_sub.id DESC LIMIT 1
        ) ngo_req ON true
        LEFT JOIN users ngo_user ON ngo_req.receiver_id = ngo_user.id
        LEFT JOIN ngos ngo_org ON ngo_org.user_id = ngo_user.id
        LEFT JOIN users assigned_staff ON ngo_req.assigned_staff_id = assigned_staff.id
        LEFT JOIN users picked_staff ON ngo_req.picked_up_by_staff_id = picked_staff.id
        LEFT JOIN users hub_staff ON ngo_req.received_at_hub_by_staff_id = hub_staff.id
        LEFT JOIN pickup_points pp ON ngo_req.distributed_pickup_point_id = pp.id
        WHERE f.donor_id = $1
        ORDER BY f.id DESC LIMIT 20;`,
        [userId]
      );

      for (const r of donorFoodRes.rows) {
        const foodTitle = r.food_name || r.title || 'Food Meal Boxes';
        const threadObj = buildPostLifecycleThread(r);

        // A: Post Created
        notifications.push({
          id: `donor_fp_${r.post_id}`,
          food_post_id: r.post_id,
          type: 'donor_posted',
          title: '🍲 Food Donation Active',
          subtitle: `Your post "${foodTitle}" (${r.initial_quantity} portions) is live and visible to partner NGOs.`,
          message: `Your post "${foodTitle}" (${r.initial_quantity} portions) is live and visible to partner NGOs.`,
          time: formatTimeAgo(r.post_created_at),
          timestamp: new Date(r.post_created_at).getTime(),
          unread: Date.now() - new Date(r.post_created_at).getTime() < 12 * 60 * 60 * 1000,
          is_read: Date.now() - new Date(r.post_created_at).getTime() >= 12 * 60 * 60 * 1000,
          thread: threadObj.steps,
          lifecycle: threadObj
        });

        // B: NGO Accepted
        if (r.ngo_requested_at) {
          const ngoName = r.ngo_organization_name || r.ngo_user_name || 'Partner NGO';
          notifications.push({
            id: `donor_ngo_${r.ngo_request_id}`,
            food_post_id: r.post_id,
            type: 'ngo_accepted',
            title: '🏢 NGO Collection Confirmed',
            subtitle: `${ngoName} accepted collection for Post #${r.post_id} (${foodTitle}). Pickup team is preparing.`,
            message: `${ngoName} accepted collection for Post #${r.post_id} (${foodTitle}). Pickup team is preparing.`,
            time: formatTimeAgo(r.ngo_requested_at),
            timestamp: new Date(r.ngo_requested_at).getTime(),
            unread: false,
            is_read: true,
            thread: threadObj.steps,
            lifecycle: threadObj
          });
        }

        // C: Staff Picked Up
        if (r.picked_up_at) {
          const staff = r.picked_up_staff_name || r.assigned_staff_name || 'Pickup Staff';
          notifications.push({
            id: `donor_pickup_${r.ngo_request_id}`,
            food_post_id: r.post_id,
            type: 'staff_picked_up',
            title: '🛵 Food Successfully Collected',
            subtitle: `Staff ${staff} collected ${foodTitle} from your address. Thank you for your generosity!`,
            message: `Staff ${staff} collected ${foodTitle} from your address. Thank you for your generosity!`,
            time: formatTimeAgo(r.picked_up_at),
            timestamp: new Date(r.picked_up_at).getTime(),
            unread: false,
            is_read: true,
            thread: threadObj.steps,
            lifecycle: threadObj
          });
        }

        // D: Inspected at Hub
        if (r.received_at_hub_at) {
          notifications.push({
            id: `donor_hub_${r.ngo_request_id}`,
            food_post_id: r.post_id,
            type: 'hub_checked',
            title: '🔬 Food Safety Confirmed at NGO Hub',
            subtitle: `Quality inspection passed for "${foodTitle}". Verified safe for distribution.`,
            message: `Quality inspection passed for "${foodTitle}". Verified safe for distribution.`,
            time: formatTimeAgo(r.received_at_hub_at),
            timestamp: new Date(r.received_at_hub_at).getTime(),
            unread: false,
            is_read: true,
            thread: threadObj.steps,
            lifecycle: threadObj
          });
        }

        // E: Beneficiaries Received
        const logs = Array.isArray(r.distribution_logs) ? r.distribution_logs : [];
        if (logs.length > 0) {
          const totalReceived = logs.reduce((acc, l) => acc + (Number(l.quantity) || 1), 0);
          notifications.push({
            id: `donor_beneficiary_${r.ngo_request_id}`,
            food_post_id: r.post_id,
            type: 'beneficiary_collected',
            title: '🤝 Meals Distributed to Beneficiaries',
            subtitle: `${totalReceived} portions of ${foodTitle} handed over to hungry families in need.`,
            message: `${totalReceived} portions of ${foodTitle} handed over to hungry families in need.`,
            time: formatTimeAgo(logs[logs.length - 1]?.handed_over_at),
            timestamp: new Date(logs[logs.length - 1]?.handed_over_at).getTime(),
            unread: false,
            is_read: true,
            thread: threadObj.steps,
            lifecycle: threadObj
          });
        }
      }

      // F: Ratings received for this Donor
      const ratingsRes = await db.query(
        `SELECT r.*, u.name AS author_name 
         FROM ratings r
         LEFT JOIN users u ON r.author_id = u.id
         WHERE r.target_user_id = $1
         ORDER BY r.created_at DESC LIMIT 5;`,
        [userId]
      );
      for (const rat of ratingsRes.rows) {
        notifications.push({
          id: `rating_${rat.id}`,
          type: 'rating_received',
          title: '⭐ New Feedback Received',
          subtitle: `${rat.author_name || 'A beneficiary'} rated you ${rat.score}/5: "${rat.comment || 'Thank you for the delicious meal!'}"`,
          message: `${rat.author_name || 'A beneficiary'} rated you ${rat.score}/5: "${rat.comment || 'Thank you for the delicious meal!'}"`,
          time: formatTimeAgo(rat.created_at),
          timestamp: new Date(rat.created_at).getTime(),
          unread: false,
          is_read: true
        });
      }
    }

    // ==========================================
    // ROLE: NGO (Admin, Receiving Staff, Distributing Staff)
    // ==========================================
    else if (userRole === 'ngo') {
      // ----------------------------------------------------
      // Scenario A: Receiving Staff (ngo_staff_role === 'receiving_staff')
      // ----------------------------------------------------
      if (staffRole === 'receiving_staff') {
        const staffRes = await db.query(
          `SELECT 
            f.id AS post_id,
            f.food_name,
            f.title,
            f.food_type,
            f.quantity AS initial_quantity,
            f.district,
            f.thana,
            f.area_ward,
            f.road_no,
            f.house_no,
            f.floor_flat,
            u_donor.name AS donor_name,
            u_donor.phone AS donor_phone,
            ngo_req.id AS ngo_request_id,
            ngo_req.assigned_staff_id,
            ngo_req.picked_up_at,
            ngo_req.received_at_hub_at,
            ngo_req.total_packets,
            ngo_req.remaining_packets,
            ngo_req.created_at AS ngo_requested_at,
            ngo_req.distribution_logs
          FROM food_requests ngo_req
          JOIN food_posts f ON ngo_req.food_post_id = f.id
          JOIN users u_donor ON f.donor_id = u_donor.id
          WHERE (ngo_req.assigned_staff_id = $1 OR ngo_req.picked_up_by_staff_id = $1)
          ORDER BY ngo_req.id DESC LIMIT 15;`,
          [userId]
        );

        for (const r of staffRes.rows) {
          const foodTitle = r.food_name || r.title || 'Food Donation';
          const donorAddress = [r.floor_flat, r.house_no, r.road_no, r.area_ward, r.thana, r.district].filter(Boolean).join(', ') || 'Donor Location';
          const progressBar = buildStaffProgressBar(r);

          if (!r.picked_up_at) {
            // New Assignment Pending Pickup
            notifications.push({
              id: `rec_assign_${r.ngo_request_id}`,
              food_post_id: r.post_id,
              type: 'staff_assignment',
              title: '🛵 New Food Pickup Assigned',
              subtitle: `Post #${r.post_id}: Pick up ${r.initial_quantity} portions of ${foodTitle} from ${r.donor_name} (${r.donor_phone || 'N/A'}) at ${donorAddress}.`,
              message: `Post #${r.post_id}: Pick up ${r.initial_quantity} portions of ${foodTitle} from ${r.donor_name} (${r.donor_phone || 'N/A'}) at ${donorAddress}.`,
              time: formatTimeAgo(r.ngo_requested_at),
              timestamp: new Date(r.ngo_requested_at).getTime(),
              unread: true,
              is_read: false,
              progress_bar: progressBar
            });
          } else {
            // Pickup completed
            notifications.push({
              id: `rec_done_${r.ngo_request_id}`,
              food_post_id: r.post_id,
              type: 'staff_pickup_done',
              title: '✅ Pickup Completed & Heading to Hub',
              subtitle: `Successfully collected ${foodTitle} from ${r.donor_name}. Progress: En route to NGO Hub.`,
              message: `Successfully collected ${foodTitle} from ${r.donor_name}. Progress: En route to NGO Hub.`,
              time: formatTimeAgo(r.picked_up_at),
              timestamp: new Date(r.picked_up_at).getTime(),
              unread: false,
              is_read: true,
              progress_bar: progressBar
            });
          }
        }
      }

      // ----------------------------------------------------
      // Scenario B: Distributing Staff (ngo_staff_role === 'distributor_staff')
      // ----------------------------------------------------
      else if (staffRole === 'distributor_staff') {
        // B1: Food arriving / staging at hub
        const distHubRes = await db.query(
          `SELECT 
            f.id AS post_id,
            f.food_name,
            f.title,
            f.food_type,
            f.quantity AS initial_quantity,
            u_donor.name AS donor_name,
            staff_pickup.name AS pickup_staff_name,
            ngo_req.id AS ngo_request_id,
            ngo_req.assigned_staff_id,
            ngo_req.picked_up_at,
            ngo_req.received_at_hub_at,
            ngo_req.total_packets,
            ngo_req.remaining_packets,
            pp.name AS pickup_point_name,
            ngo_req.distribution_logs
          FROM food_requests ngo_req
          JOIN food_posts f ON ngo_req.food_post_id = f.id
          JOIN users u_donor ON f.donor_id = u_donor.id
          LEFT JOIN users staff_pickup ON ngo_req.picked_up_by_staff_id = staff_pickup.id
          LEFT JOIN pickup_points pp ON ngo_req.distributed_pickup_point_id = pp.id
          WHERE ngo_req.picked_up_at IS NOT NULL
          ORDER BY ngo_req.picked_up_at DESC LIMIT 15;`
        );

        for (const r of distHubRes.rows) {
          const foodTitle = r.food_name || r.title || 'Food Donation';
          const progressBar = buildStaffProgressBar(r);

          if (!r.received_at_hub_at) {
            // Food arriving soon
            notifications.push({
              id: `dist_arriving_${r.ngo_request_id}`,
              food_post_id: r.post_id,
              type: 'food_arriving',
              title: '🚚 Food Arriving at Hub',
              subtitle: `${r.pickup_staff_name || 'Staff'} is transporting ${r.initial_quantity} portions of ${foodTitle} to NGO Hub. Prepare for inspection.`,
              message: `${r.pickup_staff_name || 'Staff'} is transporting ${r.initial_quantity} portions of ${foodTitle} to NGO Hub. Prepare for inspection.`,
              time: formatTimeAgo(r.picked_up_at),
              timestamp: new Date(r.picked_up_at).getTime(),
              unread: true,
              is_read: false,
              progress_bar: progressBar
            });
          } else {
            // Food arrived and staged for distribution
            notifications.push({
              id: `dist_staged_${r.ngo_request_id}`,
              food_post_id: r.post_id,
              type: 'food_staged',
              title: '📦 Food Staged for Distribution',
              subtitle: `${r.total_packets || r.initial_quantity} packets of ${foodTitle} staged at ${r.pickup_point_name || 'Distribution Hub'} (${r.remaining_packets ?? 0} remaining).`,
              message: `${r.total_packets || r.initial_quantity} packets of ${foodTitle} staged at ${r.pickup_point_name || 'Distribution Hub'} (${r.remaining_packets ?? 0} remaining).`,
              time: formatTimeAgo(r.received_at_hub_at),
              timestamp: new Date(r.received_at_hub_at).getTime(),
              unread: false,
              is_read: true,
              progress_bar: progressBar
            });
          }
        }

        // B2: Food requests from seekers
        const seekerReqRes = await db.query(
          `SELECT 
            fr.id,
            fr.food_post_id,
            fr.requested_quantity,
            fr.pickup_code,
            fr.status,
            fr.created_at,
            u.name AS receiver_name,
            f.food_name,
            f.title
          FROM food_requests fr
          JOIN users u ON fr.receiver_id = u.id
          JOIN food_posts f ON fr.food_post_id = f.id
          WHERE u.role = 'receiver'
          ORDER BY fr.id DESC LIMIT 10;`
        );

        for (const sr of seekerReqRes.rows) {
          const foodTitle = sr.food_name || sr.title || 'Food Portion';
          notifications.push({
            id: `seeker_req_${sr.id}`,
            food_post_id: sr.food_post_id,
            type: 'new_food_request',
            title: '🙋 New Food Request from Seeker',
            subtitle: `${sr.receiver_name} requested ${sr.requested_quantity} packets of ${foodTitle} (Code: ${sr.pickup_code || 'Pending'}).`,
            message: `${sr.receiver_name} requested ${sr.requested_quantity} packets of ${foodTitle} (Code: ${sr.pickup_code || 'Pending'}).`,
            time: formatTimeAgo(sr.created_at),
            timestamp: new Date(sr.created_at).getTime(),
            unread: sr.status === 'requested',
            is_read: sr.status !== 'requested',
            progress_bar: {
              current_step: sr.status === 'fulfilled' ? 5 : 4,
              current_label: sr.status === 'fulfilled' ? 'Distributing' : 'At NGO Hub',
              stages: [
                { step: 1, key: 'accepted_by_donor', label: 'Accepted by Donor', completed: true },
                { step: 2, key: 'staff_assigned', label: 'Receiving Staff Assigned', completed: true },
                { step: 3, key: 'picked_up', label: 'Picked Up', completed: true },
                { step: 4, key: 'at_hub', label: 'At NGO Hub', completed: true },
                { step: 5, key: 'distributing', label: 'Distributing', completed: sr.status === 'fulfilled' }
              ]
            }
          });
        }
      }

      // ----------------------------------------------------
      // Scenario C: NGO Admin (Supervisor / Manager)
      // ----------------------------------------------------
      else {
        // Fetch food posts this NGO is involved with + recent donations available in area
        const ngoQuery = `
          SELECT 
            f.id AS post_id,
            f.food_name,
            f.title,
            f.food_type,
            f.quantity AS initial_quantity,
            f.district,
            f.thana,
            f.area_ward,
            f.road_no,
            f.house_no,
            f.floor_flat,
            f.created_at AS post_created_at,
            u.id AS donor_id,
            u.name AS donor_name,
            u.phone AS donor_phone,
            u.email AS donor_email,
            ngo_req.id AS ngo_request_id,
            ngo_req.status AS ngo_request_status,
            ngo_req.created_at AS ngo_requested_at,
            ngo_user.id AS ngo_user_id,
            ngo_user.name AS ngo_user_name,
            ngo_user.phone AS ngo_user_phone,
            ngo_org.organization_name AS ngo_organization_name,
            assigned_staff.id AS assigned_staff_id,
            assigned_staff.name AS assigned_staff_name,
            assigned_staff.phone AS assigned_staff_phone,
            picked_staff.name AS picked_up_staff_name,
            picked_staff.phone AS picked_up_staff_phone,
            ngo_req.picked_up_at,
            hub_staff.name AS hub_staff_name,
            hub_staff.phone AS hub_staff_phone,
            ngo_req.received_at_hub_at,
            pp.id AS pickup_point_id,
            pp.name AS pickup_point_name,
            pp.address AS pickup_point_address,
            ngo_req.total_packets,
            ngo_req.remaining_packets,
            ngo_req.distribution_logs
          FROM food_posts f
          JOIN users u ON f.donor_id = u.id
          LEFT JOIN LATERAL (
            SELECT fr_sub.* FROM food_requests fr_sub
            WHERE fr_sub.food_post_id = f.id AND (fr_sub.receiver_id = $1 OR fr_sub.receiver_id IN (SELECT user_id FROM ngos WHERE user_id = $1))
            ORDER BY fr_sub.id DESC LIMIT 1
          ) ngo_req ON true
          LEFT JOIN users ngo_user ON ngo_req.receiver_id = ngo_user.id
          LEFT JOIN ngos ngo_org ON ngo_org.user_id = ngo_user.id
          LEFT JOIN users assigned_staff ON ngo_req.assigned_staff_id = assigned_staff.id
          LEFT JOIN users picked_staff ON ngo_req.picked_up_by_staff_id = picked_staff.id
          LEFT JOIN users hub_staff ON ngo_req.received_at_hub_by_staff_id = hub_staff.id
          LEFT JOIN pickup_points pp ON ngo_req.distributed_pickup_point_id = pp.id
          ORDER BY f.id DESC LIMIT 15;
        `;
        const ngoRes = await db.query(ngoQuery, [userId]);

        for (const r of ngoRes.rows) {
          const foodTitle = r.food_name || r.title || 'Food Meal Boxes';
          const threadObj = buildPostLifecycleThread(r);

          if (r.ngo_request_id) {
            // Active collection thread
            notifications.push({
              id: `ngo_active_${r.ngo_request_id}`,
              food_post_id: r.post_id,
              type: 'ngo_collection_active',
              title: `📦 Collection: ${foodTitle}`,
              subtitle: `Post #${r.post_id} - ${r.initial_quantity} portions from ${r.donor_name}. Status: ${threadObj.steps[threadObj.steps.length - 1]?.title || 'In Progress'}`,
              message: `Post #${r.post_id} - ${r.initial_quantity} portions from ${r.donor_name}. Status: ${threadObj.steps[threadObj.steps.length - 1]?.title || 'In Progress'}`,
              time: formatTimeAgo(r.received_at_hub_at || r.picked_up_at || r.ngo_requested_at),
              timestamp: new Date(r.received_at_hub_at || r.picked_up_at || r.ngo_requested_at).getTime(),
              unread: false,
              is_read: true,
              thread: threadObj.steps,
              lifecycle: threadObj
            });
          } else {
            // New available post in platform
            notifications.push({
              id: `ngo_new_fp_${r.post_id}`,
              food_post_id: r.post_id,
              type: 'new_food_available',
              title: '🍲 New Food Donation Available',
              subtitle: `${r.donor_name} posted ${r.initial_quantity} portions of ${foodTitle} in ${r.thana || r.district || 'Dhaka'}. Ready for pickup.`,
              message: `${r.donor_name} posted ${r.initial_quantity} portions of ${foodTitle} in ${r.thana || r.district || 'Dhaka'}. Ready for pickup.`,
              time: formatTimeAgo(r.post_created_at),
              timestamp: new Date(r.post_created_at).getTime(),
              unread: Date.now() - new Date(r.post_created_at).getTime() < 12 * 60 * 60 * 1000,
              is_read: Date.now() - new Date(r.post_created_at).getTime() >= 12 * 60 * 60 * 1000,
              thread: threadObj.steps,
              lifecycle: threadObj
            });
          }
        }
      }
    }

    // ==========================================
    // ROLE: RECEIVER (FOOD SEEKER)
    // ==========================================
    else if (userRole === 'receiver') {
      const recReqRes = await db.query(
        `SELECT 
          fr.id AS request_id,
          fr.food_post_id,
          fr.requested_quantity,
          fr.pickup_code,
          fr.status AS request_status,
          fr.created_at AS requested_at,
          fr.fulfilled_at,
          f.food_name,
          f.title AS food_title,
          f.food_type,
          f.donor_id,
          u_donor.name AS donor_name,
          u_donor.phone AS donor_phone,
          pp.name AS pickup_point_name,
          pp.address AS pickup_point_address,
          (SELECT COUNT(*) FROM ratings WHERE author_id = $1 AND food_post_id = fr.food_post_id) AS existing_review_count
        FROM food_requests fr
        JOIN food_posts f ON fr.food_post_id = f.id
        LEFT JOIN users u_donor ON f.donor_id = u_donor.id
        LEFT JOIN LATERAL (
          SELECT fr_ngo.distributed_pickup_point_id 
          FROM food_requests fr_ngo
          WHERE fr_ngo.food_post_id = f.id AND fr_ngo.distributed_pickup_point_id IS NOT NULL
          LIMIT 1
        ) active_dist ON true
        LEFT JOIN pickup_points pp ON active_dist.distributed_pickup_point_id = pp.id
        WHERE fr.receiver_id = $1
        ORDER BY fr.id DESC LIMIT 15;`,
        [userId]
      );

      for (const r of recReqRes.rows) {
        const foodTitle = r.food_name || r.food_title || `${r.food_type || 'Cooked'} Meal`;
        const status = (r.request_status || 'requested').toLowerCase();
        const isFulfilled = status === 'fulfilled' || status === 'completed';
        const isAccepted = status === 'approved' || status === 'accepted' || isFulfilled;
        const isRejected = status === 'rejected' || status === 'cancelled';
        const hasReviewed = Number(r.existing_review_count) > 0;

        // Construct 4-step Seeker Thread
        const seekerThread = [
          {
            step: 1,
            label: 'Request Submitted',
            title: '📝 Food Claim Submitted',
            detail: `You requested ${r.requested_quantity || 1} portion(s) of "${foodTitle}".`,
            time: formatTimeAgo(r.requested_at),
            status: 'completed'
          },
          {
            step: 2,
            label: isRejected ? 'Request Rejected' : 'Approval & Code',
            title: isRejected ? '❌ Request Declined' : isAccepted ? '✅ Request Confirmed' : '⏳ Awaiting Hub Confirmation',
            detail: isRejected
              ? 'This food request was declined due to quota or packet limits.'
              : isAccepted
              ? `Your claim is confirmed! Show Pickup Code: ${r.pickup_code || 'SM-READY'} at ${r.pickup_point_name || 'NGO Hub Point'}.`
              : 'The NGO distribution hub is processing meal packaging.',
            time: isAccepted ? 'Confirmed' : isRejected ? 'Declined' : 'Pending',
            status: isRejected ? 'rejected' : isAccepted ? 'completed' : 'pending'
          },
          {
            step: 3,
            label: 'Food Taken',
            title: isFulfilled ? '🤝 Food Taken & Verified' : '📦 Awaiting Collection',
            detail: isFulfilled
              ? `Meals safely collected at ${r.pickup_point_name || 'Hub'}. Verified by staff with Pickup Code ${r.pickup_code}.`
              : `Pickup Point: ${r.pickup_point_name || 'NGO Hub'} (${r.pickup_point_address || 'Central Point'}). Bring code ${r.pickup_code}.`,
            time: isFulfilled ? formatTimeAgo(r.fulfilled_at) : 'Pending Collection',
            status: isFulfilled ? 'completed' : isAccepted ? 'in_progress' : 'pending'
          },
          {
            step: 4,
            label: 'Review & Feedback',
            title: hasReviewed ? '⭐ Review Submitted' : isFulfilled ? '⭐ Leave a Review' : '⭐ Review Experience',
            detail: hasReviewed
              ? 'You shared your feedback and ratings for this meal. Thank you!'
              : isFulfilled
              ? 'Food collected! Please rate your meal and donor to support the community.'
              : 'Available once meal is collected from the hub.',
            time: hasReviewed ? 'Submitted' : isFulfilled ? 'Action Ready' : 'Pending',
            status: hasReviewed ? 'completed' : isFulfilled ? 'action_required' : 'pending',
            can_review: isFulfilled && !hasReviewed,
            food_post_id: r.food_post_id,
            donor_id: r.donor_id
          }
        ];

        let title = '🍲 Food Request Update';
        let subtitle = `Request for ${foodTitle}`;
        let notifType = 'seeker_request_update';

        if (isFulfilled) {
          title = '🤝 Food Taken - Please Leave a Review!';
          subtitle = `You collected ${r.requested_quantity} portions of ${foodTitle}. Rate your meal to thank donor ${r.donor_name || 'Donor'}!`;
          notifType = 'food_taken_review';
        } else if (isAccepted) {
          title = '🎉 Food Request Accepted!';
          subtitle = `Your request for ${foodTitle} is ready. Pickup Code: ${r.pickup_code || 'SM-READY'} at ${r.pickup_point_name || 'NGO Hub'}.`;
          notifType = 'request_accepted';
        } else if (isRejected) {
          title = '❌ Food Request Update';
          subtitle = `Your request for ${foodTitle} could not be fulfilled. Check other available meals in Find Food.`;
          notifType = 'request_rejected';
        } else {
          title = '⏳ Food Request Processing';
          subtitle = `Your request for ${foodTitle} is waiting for NGO confirmation.`;
          notifType = 'request_pending';
        }

        notifications.push({
          id: `rec_req_${r.request_id}`,
          request_id: r.request_id,
          food_post_id: r.food_post_id,
          donor_id: r.donor_id,
          pickup_code: r.pickup_code,
          type: notifType,
          title,
          subtitle,
          message: subtitle,
          time: formatTimeAgo(r.fulfilled_at || r.requested_at),
          timestamp: new Date(r.fulfilled_at || r.requested_at).getTime(),
          unread: !isFulfilled && !isRejected,
          is_read: isFulfilled || isRejected,
          thread: seekerThread,
          can_review: isFulfilled && !hasReviewed,
          has_reviewed: hasReviewed,
          pickup_point: r.pickup_point_name ? `${r.pickup_point_name}, ${r.pickup_point_address || ''}` : null
        });
      }
    }

    // Sort newest first
    notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: notifications,
      notifications // support both keys for frontend convenience
    });
  } catch (error) {
    console.error('Error in getMyNotifications:', error);
    next(error);
  }
};

/**
 * Get individual food post thread for authenticated users
 */
const getFoodPostThread = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const foodRes = await db.query(
      `SELECT 
        f.id AS post_id,
        f.food_name,
        f.title,
        f.food_type,
        f.quantity AS initial_quantity,
        f.expiry_time,
        f.district,
        f.thana,
        f.area_ward,
        f.road_no,
        f.house_no,
        f.floor_flat,
        f.image_url,
        f.notes AS donor_notes,
        f.status AS post_status,
        f.created_at AS post_created_at,
        u.id AS donor_id,
        u.name AS donor_name,
        u.phone AS donor_phone,
        u.email AS donor_email,
        ngo_req.id AS ngo_request_id,
        ngo_req.status AS ngo_request_status,
        ngo_req.created_at AS ngo_requested_at,
        ngo_user.id AS ngo_user_id,
        ngo_user.name AS ngo_user_name,
        ngo_user.phone AS ngo_user_phone,
        ngo_org.organization_name AS ngo_organization_name,
        assigned_staff.id AS assigned_staff_id,
        assigned_staff.name AS assigned_staff_name,
        assigned_staff.phone AS assigned_staff_phone,
        picked_staff.id AS picked_up_by_staff_id,
        picked_staff.name AS picked_up_staff_name,
        picked_staff.phone AS picked_up_staff_phone,
        ngo_req.picked_up_at,
        hub_staff.id AS received_at_hub_by_staff_id,
        hub_staff.name AS hub_staff_name,
        hub_staff.phone AS hub_staff_phone,
        ngo_req.received_at_hub_at,
        pp.id AS pickup_point_id,
        pp.name AS pickup_point_name,
        pp.address AS pickup_point_address,
        pp.operating_hours AS pickup_point_hours,
        ngo_req.total_packets,
        ngo_req.remaining_packets,
        ngo_req.distribution_logs
      FROM food_posts f
      JOIN users u ON f.donor_id = u.id
      LEFT JOIN LATERAL (
        SELECT fr_sub.* FROM food_requests fr_sub
        JOIN users u_ngo ON fr_sub.receiver_id = u_ngo.id
        WHERE fr_sub.food_post_id = f.id AND u_ngo.role = 'ngo'
        ORDER BY fr_sub.id DESC LIMIT 1
      ) ngo_req ON true
      LEFT JOIN users ngo_user ON ngo_req.receiver_id = ngo_user.id
      LEFT JOIN ngos ngo_org ON ngo_org.user_id = ngo_user.id
      LEFT JOIN users assigned_staff ON ngo_req.assigned_staff_id = assigned_staff.id
      LEFT JOIN users picked_staff ON ngo_req.picked_up_by_staff_id = picked_staff.id
      LEFT JOIN users hub_staff ON ngo_req.received_at_hub_by_staff_id = hub_staff.id
      LEFT JOIN pickup_points pp ON ngo_req.distributed_pickup_point_id = pp.id
      WHERE f.id = $1
      ORDER BY f.id DESC;`,
      [postId]
    );

    if (foodRes.rows.length === 0) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    const threadObj = buildPostLifecycleThread(foodRes.rows[0]);
    return res.status(200).json({
      message: 'Lifecycle thread retrieved successfully',
      thread: threadObj
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    // If it's a DB notification (e.g. 'db_12' or number)
    const dbId = String(rawId).startsWith('db_') ? rawId.replace('db_', '') : rawId;

    if (!isNaN(dbId)) {
      await notificationModel.markAsRead(dbId, req.user.id);
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      data: { id: rawId, is_read: true }
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationModel.markAllAsRead(req.user.id);
    return res.status(200).json({
      message: 'All notifications marked as read',
      data: []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getFoodPostThread,
  markNotificationRead,
  markAllNotificationsRead
};
