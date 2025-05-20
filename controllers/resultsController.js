const db = require('../db');

exports.saveScore = async (req, res) => {
  const { username, score } = req.body;
  try {
    await db.query('INSERT INTO scores (username, score) VALUES (?, ?)', [username, score]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

exports.saveWrongAnswers = async (req, res) => {
  const { username, wrongIds } = req.body;
  try {
    const values = wrongIds.map(id => [username, id]);
    await db.query('INSERT INTO wrong_answers (username, idiom_id) VALUES ?', [values]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

exports.getWrongAnswers = async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.word, i.meaning 
       FROM wrong_answers w 
       JOIN idioms i ON w.idiom_id = i.id 
       WHERE w.username = ?`,
      [username]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

exports.getRanking = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT username, MAX(score) AS score
      FROM scores
      GROUP BY username
      ORDER BY score DESC
      LIMIT 10;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

// 학습률 및 정확도 계산 API - 모드별 학습률 계산 가능
exports.getStats = async (req, res) => {
  const { username } = req.params;
  const mode = Number(req.query.mode) || 100;  // 기본값은 100문제 모드

  try {
    // 오답 개수
    const [[{ wrong }]] = await db.query(
      'SELECT COUNT(*) AS wrong FROM wrong_answers WHERE username = ?', 
      [username]
    );

    // 최고 점수 (맞힌 개수)
    const [[{ score }]] = await db.query(
      'SELECT MAX(score) AS score FROM scores WHERE username = ?', 
      [username]
    );

    // 전체 학습 시도 수: 정답 + 오답
    const learned = score + wrong;

    // 정확도와 학습률 계산 (mode 세트 기준으로)
    const accuracy = learned > 0 ? ((score / learned) * 100).toFixed(1) : 0;
    const progress = ((learned / mode) * 100).toFixed(1); // mode 기준 학습률

    res.json({
      learned,
      correct: score,
      wrong,
      accuracy: Number(accuracy), // 정확도 %
      progress: Number(progress), // 학습률 %
      mode
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};
