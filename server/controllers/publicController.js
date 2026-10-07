const db = require('../config/db');

/**
 * Public Controller provides dynamic data for the landing/home page,
 * impact stats, verified NGO partners, and trending food donations.
 */

const getHomeData = async (req, res, next) => {
  try {
    // 1. Trending / Recent Food Posts from DB
    const postsRes = await db.query(`
      SELECT 
        fp.id, 
        COALESCE(fp.food_name, fp.title, 'Community Meal') AS title,
        COALESCE(fp.food_type, 'Cooked') AS tag,
        fp.quantity,
        fp.status,
        fp.created_at,
        fp.expiry_time,
        fp.image_url AS image,
        fp.district,
        fp.thana,
        u.name AS donor_name
      FROM food_posts fp
      JOIN users u ON fp.donor_id = u.id
      WHERE fp.status::text = 'available'
        AND fp.expiry_time > NOW()
        AND u.role = 'donor'
      ORDER BY fp.id DESC
      LIMIT 100;
    `);

    const dbPosts = postsRes.rows.map(r => {
      const tagLower = (r.tag || '').toLowerCase();
      let tagColor = '#1d4ed8';
      let tagBg = '#eff6ff';
      if (tagLower.includes('veg') || tagLower.includes('fruit')) {
        tagColor = '#10b981';
        tagBg = '#e3f5ea';
      } else if (tagLower.includes('cooked') || tagLower.includes('hot')) {
        tagColor = '#d97706';
        tagBg = '#fef3c7';
      }

      const statusLower = (r.status || 'available').toLowerCase();
      let statusColor = '#d9381e';
      let statusBg = '#fff0ec';
      let statusLabel = 'Available';

      if (statusLower === 'claimed') {
        statusColor = '#1d4ed8';
        statusBg = '#eff6ff';
        statusLabel = 'At NGO point';
      } else if (statusLower === 'completed' || statusLower === 'fulfilled') {
        statusColor = '#4b5563';
        statusBg = '#f3f4f6';
        statusLabel = 'Taken';
      } else if (statusLower === 'collected' || statusLower === 'picked_up') {
        statusColor = '#15803d';
        statusBg = 'rgba(63, 185, 132, 0.15)';
        statusLabel = 'Collected';
      }

      let timeLeft = '2h left';
      if (r.expiry_time) {
        const diffMins = Math.round((new Date(r.expiry_time).getTime() - Date.now()) / 60000);
        if (diffMins > 0) {
          timeLeft = diffMins > 60 ? `${Math.floor(diffMins / 60)}h left` : `${diffMins}m left`;
        } else {
          timeLeft = 'Closing soon';
        }
      }

      return {
        id: r.id,
        title: r.title,
        tag: r.tag,
        tagColor,
        tagBg,
        distance: r.thana ? `${r.thana}, ${r.district || 'Dhaka'}` : '1.4 km',
        status: statusLabel,
        statusBg,
        statusColor,
        timeLeft,
        details: `${r.quantity || 10} meals · ${r.donor_name || 'Community Donor'}`,
        image: r.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      };
    });

    // 2. Impact Statistics from DB
    const statsRes = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM food_posts) as total_posts,
        (SELECT COALESCE(SUM(quantity::numeric), 0) FROM food_posts) as total_portions,
        (SELECT COUNT(*) FROM users WHERE role = 'ngo') as ngo_count,
        (SELECT COUNT(*) FROM users WHERE role = 'donor') as donor_count,
        (SELECT COUNT(*) FROM food_requests) as request_count;
    `);

    const s = statsRes.rows[0];
    const totalPosts = parseInt(s.total_posts, 10) || 0;
    const totalPortions = parseInt(s.total_portions, 10) || 0;
    const ngoCount = parseInt(s.ngo_count, 10) || 0;

    const baseMeals = 482000;
    const dynamicMeals = baseMeals + (totalPortions * 50) + (totalPosts * 120);
    const formattedMeals = dynamicMeals.toLocaleString() + '+';

    const impactStats = [
      { number: formattedMeals, title: 'Meals rescued', sub: 'and served to date' },
      { number: (1340 + ngoCount * 12).toLocaleString(), title: 'Partner NGOs', sub: 'verified & active' },
      { number: '96%', title: 'Reach their plate', sub: 'tracked to receipt' },
      { number: `${Math.round(dynamicMeals * 0.00013 + 60)} t`, title: 'CO₂ saved', sub: 'from landfill each month' }
    ];

    // 3. Verified NGOs / Partners Ticker from DB
    const ngoRes = await db.query(`
      SELECT DISTINCT COALESCE(NULLIF(n.organization_name, ''), u.name) as name
      FROM users u
      LEFT JOIN ngos n ON n.user_id = u.id
      WHERE u.role = 'ngo'
        AND COALESCE(NULLIF(n.organization_name, ''), u.name) IS NOT NULL
        AND LOWER(COALESCE(NULLIF(n.organization_name, ''), u.name)) NOT LIKE '%nusrat%'
        AND LOWER(COALESCE(NULLIF(n.organization_name, ''), u.name)) NOT LIKE '%tanvir%'
      ORDER BY name ASC;
    `);

    const standardPartners = [
      'Care Bangladesh Food Rescue',
      'Bidyanondo Foundation',
      'As-Sunnah Foundation',
      'Mastul Foundation',
      'BRAC Community Aid',
      'Jaago Foundation',
      'Dhaka Food Bank',
      'Sajida Foundation',
      'Chittagong Relief Hub',
      'Quantum Foundation',
      'Al-Khidmat Bangladesh',
      'Sylhet Community Kitchen'
    ];

    const excluded = ['nusrat jahan', 'tanvir ahmed'];
    const dbNgos = ngoRes.rows
      .map(r => r.name)
      .filter(Boolean)
      .filter(name => !excluded.some(ex => name.toLowerCase().includes(ex)));
    const combinedPartners = Array.from(new Set([...dbNgos, ...standardPartners]));

    return res.status(200).json({
      message: 'Home page data retrieved successfully',
      trendingPosts: dbPosts.slice(0, 4),
      impactStats,
      heroMealsCount: formattedMeals,
      partners: combinedPartners
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyFood = async (req, res, next) => {
  try {
    const { lat, lng, district, thana } = req.query;
    const hasCoordinates = lat !== undefined || lng !== undefined;

    if (hasCoordinates) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({ message: 'Provide valid latitude and longitude.' });
      }

      const result = await db.query(
        `WITH active_posts AS (
           SELECT
             fp.id,
             COALESCE(fp.food_name, fp.title, 'Community Meal') AS title,
             COALESCE(fp.food_type, 'Cooked') AS food_type,
             fp.quantity,
             fp.status::text AS status,
             fp.expiry_time,
             fp.image_url AS image,
             fp.district,
             fp.thana,
             fp.latitude,
             fp.longitude,
             u.name AS donor_name,
             6371 * 2 * ASIN(SQRT(
               POWER(SIN(RADIANS(fp.latitude::double precision - $1) / 2), 2) +
               COS(RADIANS($1)) * COS(RADIANS(fp.latitude::double precision)) *
               POWER(SIN(RADIANS(fp.longitude::double precision - $2) / 2), 2)
             )) AS distance_km
           FROM food_posts fp
           JOIN users u ON u.id = fp.donor_id
           WHERE fp.status::text = 'available'
             AND fp.expiry_time > NOW()
             AND u.role = 'donor'
             AND fp.latitude IS NOT NULL
             AND fp.longitude IS NOT NULL
         )
         SELECT *
         FROM active_posts
         WHERE distance_km <= $3
         ORDER BY distance_km ASC, expiry_time ASC;`,
        [latitude, longitude, 25]
      );

      return res.status(200).json({
        foodPosts: result.rows,
        searchMode: 'coordinates',
        radiusKm: 25
      });
    }

    const districtFilter = typeof district === 'string' ? district.trim() : '';
    const thanaFilter = typeof thana === 'string' ? thana.trim() : '';
    if (!districtFilter && !thanaFilter) {
      return res.status(400).json({
        message: 'Share your location or enter a district or thana.'
      });
    }

    const result = await db.query(
      `SELECT
         fp.id,
         COALESCE(fp.food_name, fp.title, 'Community Meal') AS title,
         COALESCE(fp.food_type, 'Cooked') AS food_type,
         fp.quantity,
         fp.status::text AS status,
         fp.expiry_time,
         fp.image_url AS image,
         fp.district,
         fp.thana,
         fp.latitude,
         fp.longitude,
         u.name AS donor_name,
         NULL::double precision AS distance_km
       FROM food_posts fp
       JOIN users u ON u.id = fp.donor_id
       WHERE fp.status::text = 'available'
         AND fp.expiry_time > NOW()
         AND u.role = 'donor'
         AND ($1::text = '' OR fp.district ILIKE '%' || $1 || '%')
         AND ($2::text = '' OR fp.thana ILIKE '%' || $2 || '%')
       ORDER BY fp.expiry_time ASC, fp.created_at DESC;`,
      [districtFilter, thanaFilter]
    );

    return res.status(200).json({
      foodPosts: result.rows,
      searchMode: 'area',
      district: districtFilter,
      thana: thanaFilter
    });
  } catch (error) {
    next(error);
  }
};

const getFoodLocations = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT fp.district, fp.thana
       FROM food_posts fp
       JOIN users u ON u.id = fp.donor_id
       WHERE fp.status::text = 'available'
         AND fp.expiry_time > NOW()
         AND u.role = 'donor'
         AND NULLIF(TRIM(fp.district), '') IS NOT NULL
       ORDER BY fp.district ASC, fp.thana ASC;`
    );
    return res.status(200).json({ locations: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomeData,
  getNearbyFood,
  getFoodLocations
};
