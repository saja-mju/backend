const express = require('express');
const router = express.Router();
// const { saveScore, saveWrongAnswers } = require('../controllers/resultsController');
const { saveScore, saveWrongAnswers, getWrongAnswers, getRanking, getStats } = require('../controllers/resultsController');

router.post('/score', saveScore);
router.post('/wrong', saveWrongAnswers);
router.get('/wrong/:username', getWrongAnswers);
router.get('/ranking', getRanking);
router.get('/stats/:username', getStats);

module.exports = router;
