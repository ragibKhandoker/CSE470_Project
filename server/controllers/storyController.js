const db = require('../config/db');

/**
 * Get all stories sorted by display_order
 */
const getStories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM stories 
       WHERE is_published = true 
       ORDER BY display_order ASC, id ASC;`
    );
    res.status(200).json({
      message: 'Stories retrieved successfully',
      stories: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all stories for admin management (including drafts if any)
 */
const getAdminStories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM stories 
       ORDER BY display_order ASC, id ASC;`
    );
    res.status(200).json({
      message: 'Stories retrieved for admin',
      stories: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Get story by ID or slug
 */
const getStoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM stories 
       WHERE slug = $1 
          OR (CASE WHEN $1 ~ '^[0-9]+$' THEN id = $1::int ELSE false END)
          OR LOWER(title) = LOWER($1)
       LIMIT 1;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.status(200).json({
      message: 'Story retrieved successfully',
      story: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new story
 */
const createStory = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      category,
      tag_color,
      tag_bg,
      tag_icon,
      read_time,
      summary,
      image,
      banner_image,
      author,
      author_role,
      author_avatar,
      paragraphs_before_quote,
      content,
      content_html,
      quote,
      is_featured
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Determine max display order
    const maxOrderRes = await db.query('SELECT COALESCE(MAX(display_order), 0) AS max_order FROM stories;');
    const nextOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;

    const generatedSlug = slugify(slug || title) || `story-${Date.now()}`;
    const parasJson = Array.isArray(paragraphs_before_quote) 
      ? JSON.stringify(paragraphs_before_quote) 
      : JSON.stringify([]);

    const insertRes = await db.query(
      `INSERT INTO stories (
        title, slug, category, tag_color, tag_bg, tag_icon,
        read_time, summary, image, banner_image, author, author_role, author_avatar,
        paragraphs_before_quote, content, content_html, quote, display_order, is_featured, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true)
      RETURNING *;`,
      [
        title,
        generatedSlug,
        category || 'Volunteer',
        tag_color || '#d9381e',
        tag_bg || '#ffe4db',
        tag_icon || '🤝',
        read_time || '4 min read',
        summary || '',
        image || '',
        banner_image || image || '',
        author || req.user?.name || 'ShareMeal Contributor',
        author_role || 'Community Lead',
        author_avatar || '',
        parasJson,
        content || content_html || '',
        content_html || content || '',
        quote || '',
        nextOrder,
        Boolean(is_featured)
      ]
    );

    res.status(201).json({
      message: 'Story created successfully',
      story: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing story
 */
const updateStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      category,
      tag_color,
      tag_bg,
      tag_icon,
      read_time,
      summary,
      image,
      banner_image,
      author,
      author_role,
      paragraphs_before_quote,
      content,
      content_html,
      quote,
      is_featured,
      is_published
    } = req.body;

    const targetSlug = slug ? slugify(slug) : (title ? slugify(title) : null);
    const parasJson = paragraphs_before_quote !== undefined
      ? JSON.stringify(Array.isArray(paragraphs_before_quote) ? paragraphs_before_quote : [])
      : null;

    const updateRes = await db.query(
      `UPDATE stories
       SET 
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        category = COALESCE($3, category),
        tag_color = COALESCE($4, tag_color),
        tag_bg = COALESCE($5, tag_bg),
        tag_icon = COALESCE($6, tag_icon),
        read_time = COALESCE($7, read_time),
        summary = COALESCE($8, summary),
        image = COALESCE($9, image),
        banner_image = COALESCE($10, banner_image),
        author = COALESCE($11, author),
        author_role = COALESCE($12, author_role),
        paragraphs_before_quote = COALESCE($13, paragraphs_before_quote),
        content = COALESCE($14, content),
        content_html = COALESCE($15, content_html),
        quote = COALESCE($16, quote),
        is_featured = COALESCE($17, is_featured),
        is_published = COALESCE($18, is_published),
        updated_at = NOW()
       WHERE id = $19
       RETURNING *;`,
      [
        title,
        targetSlug,
        category,
        tag_color,
        tag_bg,
        tag_icon,
        read_time,
        summary,
        image,
        banner_image || image,
        author,
        author_role,
        parasJson,
        content,
        content_html || content,
        quote,
        is_featured,
        is_published,
        id
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.status(200).json({
      message: 'Story updated successfully',
      story: updateRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload an image file for a story cover
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a story
 */
const deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteRes = await db.query('DELETE FROM stories WHERE id = $1 RETURNING *;', [id]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.status(200).json({
      message: 'Story deleted successfully',
      deleted: deleteRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder stories
 * Expects { orderedIds: [3, 1, 2, 4] }
 */
const reorderStories = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds array is required' });
    }

    // Update each story's display_order
    for (let index = 0; index < orderedIds.length; index++) {
      const storyId = orderedIds[index];
      await db.query(
        'UPDATE stories SET display_order = $1, updated_at = NOW() WHERE id = $2;',
        [index + 1, storyId]
      );
    }

    const updatedRes = await db.query(
      'SELECT * FROM stories ORDER BY display_order ASC, id ASC;'
    );

    res.status(200).json({
      message: 'Stories reordered successfully',
      stories: updatedRes.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStories,
  getAdminStories,
  getStoryById,
  createStory,
  updateStory,
  uploadImage,
  deleteStory,
  reorderStories
};
