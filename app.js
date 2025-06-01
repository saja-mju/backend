const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();

// 1) CORS: React(3001)에서 오는 요청을 허용
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

// ✅ JSON 요청 처리
app.use(express.json());

// ✅ 세션 설정
app.use(session({
  secret: '1f0f4f64c2d20cc504e51d2c2acd624be5436518aa8614fad094bb973b567e24139d63b5fc13d6edcbe044b27d9a7f7a0aabf17789b291864f9bb1c947ce2197',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1일
  }
}));

// 라우터 불러오기
const idiomRoutes = require('./routes/idioms');
const resultRoutes = require('./routes/results');
const userRoutes = require('./routes/users');
const viewedRoutes = require('./routes/viewed');

// ✅ API 라우터 먼저 등록
app.use('/idioms', idiomRoutes);
app.use('/results', resultRoutes);
app.use('/users', userRoutes);
app.use('/viewed', viewedRoutes);

// // ✅ 정적 파일 서빙 (React 빌드 파일)
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// // ✅ 프론트엔드 라우팅 처리 (SPA 지원용)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
// });

const root = path.join(__dirname, '../frontend/build');
app.use(express.static(root));

// wildcard 대신 정규표현식
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

// ✅ 서버 시작
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));