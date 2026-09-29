const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/home-data', publicController.getHomeData);

module.exports = router;
