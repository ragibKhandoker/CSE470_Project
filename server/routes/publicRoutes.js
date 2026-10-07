const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/home-data', publicController.getHomeData);
router.get('/food-locations', publicController.getFoodLocations);
router.get('/nearby-food', publicController.getNearbyFood);

module.exports = router;
