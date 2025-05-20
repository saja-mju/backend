const db = require('../db');
const bcrypt = require('bcrypt');

// 회원가입
exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    res.status(201).send('회원가입 성공');
  } catch (err) {
    console.error(err);
    res.status(500).send('회원가입 실패');
  }
};

// 로그인
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).send('아이디 없음');

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('비밀번호 틀림');

    res.send('로그인 성공');
  } catch (err) {
    console.error(err);
    res.status(500).send('로그인 실패');
  }
};
