// idioms.js 
const express = require('express');
const router = express.Router();
const { getIdioms } = require('../controllers/idiomsController');

router.get('/', getIdioms); // GET /idioms

module.exports = router;


