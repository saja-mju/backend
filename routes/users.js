// users.js 
// const express = require('express');
// const router = express.Router();
// const { register, login } = require('../controllers/usersController');

// router.post('/register', register);
// router.post('/login', login);

// module.exports = router;
// routes/users.js
const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  logout,
  getStatus
} = require('../controllers/usersController');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   logout);
router.get ('/status',   getStatus);  // 현재 로그인된 사용자 조회

module.exports = router;
