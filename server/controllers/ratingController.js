const ratingModel = require('../models/ratingModel');

/**
 * Rating Controller handles ratings and feedback for donors and NGOs
 */

const createRating = async (req, res, next) => {
  try {
    const author_id = req.user.id;
    const { target_user_id, score, comment, food_name, food_post_id } = req.body;

    if (!target_user_id || !score) {
      return res.status(400).json({ message: 'Target user ID and score (1-5) are required' });
    }

    const rating = await ratingModel.createRating({
      author_id,
      target_user_id,
      score: parseInt(score, 10),
      comment: comment || '',
      food_name: food_name || null,
      food_post_id: food_post_id || null
    });

    return res.status(201).json({
      message: 'Rating submitted successfully',
      data: rating
    });
  } catch (error) {
    next(error);
  }
};

const getRatingsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const ratings = await ratingModel.findByTargetUserId(userId);
    return res.status(200).json({
      message: 'User ratings retrieved successfully',
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

const getMyRatings = async (req, res, next) => {
  try {
    const authorId = req.user.id;
    const ratings = await ratingModel.findByAuthorId(authorId);
    return res.status(200).json({
      message: 'My submitted ratings retrieved successfully',
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

const deleteRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await ratingModel.deleteRating(id);
    return res.status(200).json({
      message: 'Rating deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

const getRatingTargets = async (req, res, next) => {
  try {
    const db = require('../config/db');
    const userId = req.user?.id;

    // 1. Fetch NGOs with organization name and user_id
    const ngosRes = await db.query(`
      SELECT u.id, 
             COALESCE(n.organization_name, u.name) AS name,
             'ngo' AS role
      FROM users u
      JOIN ngos n ON n.user_id = u.id
      WHERE u.role = 'ngo'
      ORDER BY name ASC
    `);

    // 2. Fetch only foods which this receiver requested and got (fulfilled / collected / completed / distributed)
    let receivedFoods = [];
    if (userId) {
      const receivedRes = await db.query(`
        SELECT 
          fr.id AS request_id,
          fr.food_post_id,
          COALESCE(fp.food_name, fp.title, 'Meal Donation') AS food_name,
          fp.donor_id,
          d.name AS donor_name,
          COALESCE(n.organization_name, 'Care Bangladesh Food Rescue') AS ngo_name,
          COALESCE(n.user_id, 11) AS ngo_user_id,
          fr.created_at
        FROM food_requests fr
        JOIN food_posts fp ON fr.food_post_id = fp.id
        LEFT JOIN users d ON fp.donor_id = d.id
        LEFT JOIN pickup_points pp ON fp.pickup_point_id = pp.id
        LEFT JOIN ngos n ON pp.ngo_id = n.id
        WHERE fr.receiver_id = $1
          AND fr.status IN ('fulfilled', 'collected', 'completed', 'delivered', 'distributed')
        ORDER BY fr.created_at DESC
      `, [userId]);

      receivedFoods = receivedRes.rows.map((r) => ({
        request_id: r.request_id,
        food_post_id: r.food_post_id,
        food_name: r.food_name,
        donor_id: r.donor_id,
        donor_name: r.donor_name || 'Verified Donor',
        ngo_user_id: r.ngo_user_id,
        ngo_name: r.ngo_name
      }));
    }

    return res.status(200).json({
      message: 'Rating targets retrieved successfully',
      data: {
        ngos: ngosRes.rows,
        receivedFoods
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRating,
  getRatingsForUser,
  getMyRatings,
  deleteRating,
  getRatingTargets
};
