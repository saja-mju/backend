// usersController.js
// const db = require('../db');
// const bcrypt = require('bcrypt');

// // 회원가입
// exports.register = async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const hashed = await bcrypt.hash(password, 10);
//     await db.query(
//       'INSERT INTO users (username, password) VALUES (?, ?)',
//       [username, hashed]
//     );
//     res.status(201).send('회원가입 성공');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('회원가입 실패');
//   }
// };

// // 로그인
// exports.login = async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const [rows] = await db.query(
//       'SELECT * FROM users WHERE username = ?',
//       [username]
//     );
//     if (rows.length === 0) return res.status(401).send('아이디 없음');

//     const user = rows[0];
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(401).send('비밀번호 틀림');

//     // 로그인 성공: 세션에 사용자명 저장
//     req.session.username = username;
//     res.send('로그인 성공');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('로그인 실패');
//   }
// };


// // 로그아웃
// exports.logout = (req, res) => {
//   // 세션 제거
//   req.session.destroy(err => {
//     if (err) {
//       console.error('logout error:', err);
//       return res.status(500).send('로그아웃 실패');
//     }
//     // 클라이언트의 세션 쿠키도 지워줍니다
//     res.clearCookie('connect.sid');
//     res.send('로그아웃 성공');
//   });
// };

// // 로그인 상태 확인
// exports.getStatus = (req, res) => {
//   if (req.session.user) {
//     res.json({ loggedIn: true, user: req.session.user });
//   } else {
//     res.json({ loggedIn: false, user: null });
//   }
// };

// controllers/usersController.js

const db = require('../db');
const bcrypt = require('bcrypt');

// 회원가입
exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    return res.status(201).json({ success: true, message: '회원가입 성공' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '회원가입 실패' });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: '아이디 없음 또는 회원 미가입 상태' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: '비밀번호가 틀립니다' });
    }

    // 로그인 성공: 세션에 사용자명 저장
    req.session.username = username;
    return res.json({ success: true, message: '로그인 성공' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '로그인 실패 (서버 오류)' });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('logout error:', err);
      return res.status(500).json({ success: false, message: '로그아웃 실패' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: '로그아웃 성공' });
  });
};

// 로그인 상태 확인
exports.getStatus = (req, res) => {
  // 로그인 시 session.username에 값을 저장하도록 했으니, 여기서도 그걸 참조
  if (req.session.username) {
    return res.json({ loggedIn: true, user: req.session.username });
  } else {
    return res.json({ loggedIn: false, user: null });
  }
};
