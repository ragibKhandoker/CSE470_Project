const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes for visitors / home page
router.get('/', storyController.getStories);
router.get('/:id', storyController.getStoryById);

// Protected management routes (NGO Admin or Super Admin)
router.get('/admin/all', protect, storyController.getAdminStories);
router.post('/upload-image', protect, upload.single('image'), storyController.uploadImage);
router.post('/', protect, storyController.createStory);
router.put('/reorder', protect, storyController.reorderStories);
router.put('/:id', protect, storyController.updateStory);
router.delete('/:id', protect, storyController.deleteStory);

module.exports = router;

