// app.js
const express       = require('express');
const session       = require('express-session');
const cors          = require('cors');
const app = express();

const idiomRoutes   = require('./routes/idioms');
const resultRoutes  = require('./routes/results');
const userRoutes    = require('./routes/users');
const viewedRoutes  = require('./routes/viewed');

// CORS 설정 (프론트가 다른 도메인/포트를 쓸 경우 credentials 허용)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// 세션 미들웨어
app.use(session({
  secret           : '1f0f4f64c2d20cc504e51d2c2acd624be5436518aa8614fad094bb973b567e24139d63b5fc13d6edcbe044b27d9a7f7a0aabf17789b291864f9bb1c947ce2197', // 실제 운영에선 환경변수로 관리하세요
  resave           : false,
  saveUninitialized: true,                   // 로그인 전에도 세션 생성
  cookie: {
    httpOnly: true,
    maxAge  : 1000 * 60 * 60 * 24            // 1일
  }
}));

// 라우터 연결
app.use('/idioms',  idiomRoutes);
app.use('/results', resultRoutes);
app.use('/users',   userRoutes);
app.use('/viewed',  viewedRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));