// results.js 
const express = require('express');
const router = express.Router();
// const { saveScore, saveWrongAnswers } = require('../controllers/resultsController');
const { saveScore, 
    saveWrongAnswers, 
    getWrongAnswers, 
    getRanking, 
    getRankingMode,
    getStats, 
    submitBasicQuiz,
    getSynonymQuiz, 
    submitSynonymQuiz, 
    getHanjaQuiz, 
    submitHanjaQuiz ,
    getDailyIdiom,
    submitDailyAnswer,
    getDailyHistory,
    getProgress
} = require('../controllers/resultsController');

router.post('/score', saveScore);
router.post('/wrong', saveWrongAnswers);
router.get('/wrong/:username', getWrongAnswers);
router.get('/ranking', getRanking);
router.get('/ranking-mode', getRankingMode);
router.get('/stats/:username', getStats);

// 기본 문제 정답 제출 
router.post('/submit-basic', submitBasicQuiz);

// 유의어 문제 
router.get('/synonym-quiz/:username', getSynonymQuiz);
router.post('/synonym-quiz/submit', submitSynonymQuiz);

// 한자 조합 문제
router.get('/hanja-quiz/:username', getHanjaQuiz);
router.post('/hanja-quiz', submitHanjaQuiz);

// 오늘의 문제
router.get('/daily/:username', getDailyIdiom);
router.post('/daily/submit', submitDailyAnswer);

// 오늘의 문제 기록용 달력 시각화 
router.get('/daily-history/:username', getDailyHistory);

// 진행률 
router.get('/progress/:username', getProgress);

module.exports = router;
