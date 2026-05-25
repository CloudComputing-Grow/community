const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');

router.get('/db-test', communityController.dbTest);

module.exports = router;