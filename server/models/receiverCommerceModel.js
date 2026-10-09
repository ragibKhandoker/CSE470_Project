const crypto = require('crypto');
const db = require('../config/db');

// food_posts.quantity is VARCHAR in older database schemas; expose its first
// numeric portion count as an integer anywhere it is compared with stock.
const postQuantitySql = `NULLIF(substring(fp.quantity from '[0-9]+'), '')::integer`;

const listCart = async (receiverId) => {
  const result = await db.query(
    `SELECT ci.id, ci.food_post_id, ci.quantity, ci.created_at,
            fp.food_name, fp.title, fp.food_type, fp.image_url, fp.receiver_price_bdt,
            fp.quantity AS post_quantity, fp.status, fp.thana, fp.district,
            COALESCE(latest.remaining_packets, ${postQuantitySql}) AS remaining_packets,
            pp.name AS pickup_point_name, pp.address AS pickup_point_address,
            ngo.organization_name AS ngo_name
     FROM receiver_cart_items ci
     JOIN food_posts fp ON fp.id = ci.food_post_id
     LEFT JOIN LATERAL (
       SELECT fr.remaining_packets FROM food_requests fr
       WHERE fr.food_post_id = fp.id AND fr.remaining_packets IS NOT NULL
       ORDER BY fr.created_at DESC LIMIT 1
     ) latest ON true
     LEFT JOIN pickup_points pp ON pp.id = fp.pickup_point_id
     LEFT JOIN ngos ngo ON ngo.user_id = fp.distribution_ngo_user_id
     WHERE ci.receiver_id = $1
     ORDER BY ci.created_at DESC`,
    [receiverId]
  );
  return result.rows;
};

const listWishlist = async (receiverId) => {
  const result = await db.query(
    `SELECT wi.id, wi.food_post_id, wi.created_at,
            fp.food_name, fp.title, fp.food_type, fp.image_url, fp.receiver_price_bdt,
            fp.quantity, fp.status, fp.thana, fp.district,
            ngo.organization_name AS ngo_name
     FROM receiver_wishlist_items wi
     JOIN food_posts fp ON fp.id = wi.food_post_id
     LEFT JOIN ngos ngo ON ngo.user_id = fp.distribution_ngo_user_id
     WHERE wi.receiver_id = $1
     ORDER BY wi.created_at DESC`,
    [receiverId]
  );
  return result.rows;
};

const ensureAvailablePost = async (foodPostId, requirePrice = false) => {
  const result = await db.query(
    `SELECT id, quantity, receiver_price_bdt, status
     FROM food_posts
     WHERE id = $1 AND status::text IN ('at_ngo_point', 'available')
       AND distribution_ngo_user_id IS NOT NULL`,
    [foodPostId]
  );
  const post = result.rows[0];
  if (!post) {
    const error = new Error('This NGO meal is no longer available.');
    error.status = 404;
    throw error;
  }
  if (requirePrice && Number(post.receiver_price_bdt) <= 0) {
    const error = new Error('This meal is not listed for purchase.');
    error.status = 400;
    throw error;
  }
  return post;
};

const addToCart = async (receiverId, foodPostId, quantity) => {
  const post = await ensureAvailablePost(foodPostId, true);
  const available = Number.parseInt(String(post.quantity || '').match(/[0-9]+/)?.[0] || '0', 10);
  if (available < 1 || quantity > available) {
    const error = new Error(`Only ${available} portions are available.`);
    error.status = 400;
    throw error;
  }
  const result = await db.query(
    `INSERT INTO receiver_cart_items (receiver_id, food_post_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (receiver_id, food_post_id)
     DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
     RETURNING id, food_post_id, quantity`,
    [receiverId, foodPostId, quantity]
  );
  return result.rows[0];
};

const setCartQuantity = async (receiverId, itemId, quantity) => {
  const result = await db.query(
    `UPDATE receiver_cart_items ci
     SET quantity = $1, updated_at = CURRENT_TIMESTAMP
     FROM food_posts fp
     WHERE ci.id = $2 AND ci.receiver_id = $3 AND fp.id = ci.food_post_id
       AND fp.status::text IN ('at_ngo_point', 'available')
       AND fp.receiver_price_bdt > 0
       AND $1 <= COALESCE((
         SELECT fr.remaining_packets FROM food_requests fr
         WHERE fr.food_post_id = fp.id AND fr.remaining_packets IS NOT NULL
         ORDER BY fr.created_at DESC LIMIT 1
       ), ${postQuantitySql})
     RETURNING ci.id, ci.food_post_id, ci.quantity`,
    [quantity, itemId, receiverId]
  );
  return result.rows[0] || null;
};

const removeCartItem = async (receiverId, itemId) => {
  const result = await db.query(
    'DELETE FROM receiver_cart_items WHERE id = $1 AND receiver_id = $2 RETURNING id',
    [itemId, receiverId]
  );
  return Boolean(result.rows[0]);
};

const addToWishlist = async (receiverId, foodPostId) => {
  await ensureAvailablePost(foodPostId);
  const result = await db.query(
    `INSERT INTO receiver_wishlist_items (receiver_id, food_post_id)
     VALUES ($1, $2) ON CONFLICT (receiver_id, food_post_id) DO NOTHING
     RETURNING id, food_post_id`,
    [receiverId, foodPostId]
  );
  return result.rows[0] || { food_post_id: foodPostId };
};

const removeWishlistItem = async (receiverId, itemId) => {
  const result = await db.query(
    'DELETE FROM receiver_wishlist_items WHERE id = $1 AND receiver_id = $2 RETURNING id',
    [itemId, receiverId]
  );
  return Boolean(result.rows[0]);
};

const checkout = async (receiverId, notes = '') => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const cart = await client.query(
      `SELECT ci.id AS cart_item_id, ci.food_post_id, ci.quantity,
              fp.food_name, fp.title, fp.quantity AS post_quantity,
              fp.receiver_price_bdt, fp.distribution_ngo_user_id,
              COALESCE(latest.remaining_packets, ${postQuantitySql}) AS remaining_packets,
              fp.status
       FROM receiver_cart_items ci
       JOIN food_posts fp ON fp.id = ci.food_post_id
       LEFT JOIN LATERAL (
         SELECT fr.remaining_packets FROM food_requests fr
         WHERE fr.food_post_id = fp.id AND fr.remaining_packets IS NOT NULL
         ORDER BY fr.created_at DESC LIMIT 1
       ) latest ON true
       WHERE ci.receiver_id = $1
       ORDER BY ci.id
       FOR UPDATE OF ci, fp`,
      [receiverId]
    );
    if (cart.rows.length === 0) {
      const error = new Error('Your cart is empty.');
      error.status = 400;
      throw error;
    }

    const createdRequests = [];
    for (const item of cart.rows) {
      if (!['available', 'at_ngo_point'].includes(String(item.status).toLowerCase()) || !item.distribution_ngo_user_id) {
        const error = new Error(`${item.food_name || item.title || 'A meal'} is no longer available.`);
        error.status = 409;
        throw error;
      }
      const remaining = Number(item.remaining_packets || 0);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.receiver_price_bdt);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > remaining) {
        const error = new Error(`Only ${remaining} portions remain for ${item.food_name || item.title || 'a meal'}.`);
        error.status = 409;
        throw error;
      }
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        const error = new Error(`${item.food_name || item.title || 'A meal'} no longer has a valid price.`);
        error.status = 409;
        throw error;
      }
      const existing = await client.query(
        `SELECT id FROM food_requests
         WHERE food_post_id = $1 AND receiver_id = $2
           AND status IN ('requested', 'approved', 'accepted', 'fulfilled')
         LIMIT 1`,
        [item.food_post_id, receiverId]
      );
      if (existing.rows[0]) {
        const error = new Error(`You already have a request for ${item.food_name || item.title || 'this meal'}.`);
        error.status = 409;
        throw error;
      }

      const pickupCode = `SM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const price = Number((unitPrice * quantity).toFixed(2));
      const inserted = await client.query(
        `INSERT INTO food_requests
           (food_post_id, receiver_id, is_anonymous, pickup_code, requested_quantity,
            notes, ngo_user_id, purchase_price_bdt, status)
         VALUES ($1, $2, false, $3, $4, $5, $6, $7, 'requested')
         RETURNING id, food_post_id, requested_quantity, purchase_price_bdt, pickup_code, status`,
        [item.food_post_id, receiverId, pickupCode, quantity, notes, item.distribution_ngo_user_id, price]
      );
      createdRequests.push(inserted.rows[0]);
    }

    await client.query('DELETE FROM receiver_cart_items WHERE receiver_id = $1', [receiverId]);
    await client.query('COMMIT');
    return createdRequests;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  listCart,
  listWishlist,
  addToCart,
  setCartQuantity,
  removeCartItem,
  addToWishlist,
  removeWishlistItem,
  checkout
};
