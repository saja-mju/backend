// resultsController.js
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

// 전체 랭킹 - 상위 10명
exports.getRanking = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT username, SUM(score) AS score
      FROM scores
      GROUP BY username
      ORDER BY score DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error('getRanking error:', err);
    res.status(500).send('DB Error');
  }
};

// 모드별 랭킹 (correct_answers 테이블)
exports.getRankingMode = async (req, res) => {
  const { mode } = req.query;

  try {
    let rows;
    if (mode) {
      // correct_answers 에 mode 필터 후, 각 사용자별 개수×가중치 합산
      [rows] = await db.query(`
        SELECT username,
               SUM(
                 CASE mode
                   WHEN 'basic'   THEN 10
                   WHEN 'synonym' THEN 20
                   WHEN 'hanja'   THEN 10
                   ELSE 0
                 END
               ) AS score
        FROM correct_answers
        WHERE mode = ?
        GROUP BY username
        ORDER BY score DESC
        LIMIT 10
      `, [mode]);
    } else {
      // mode 파라미터 없으면 전체 scores 테이블 기준
      [rows] = await db.query(`
        SELECT username, SUM(score) AS score
        FROM scores
        GROUP BY username
        ORDER BY score DESC
        LIMIT 10
      `);
    }

    res.json(rows);
  } catch (err) {
    console.error('getRankingMode error:', err);
    res.status(500).send('DB Error');
  }
};

// 학습률 및 정확도 계산 API - 모드별 학습률 계산 가능
exports.getStats = async (req, res) => {
  const { username } = req.params;
  const mode = 599;  // 전체 문제수 기준 

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

// 오답 처리 관련 
exports.saveWrongAnswers = async (req, res) => {
  const { username, wrongIds, mode = 'basic' } = req.body; // mode 기본값은 'basic'

  try {
    const values = wrongIds.map(id => [username, id, mode]);

    await db.query(
      'INSERT INTO wrong_answers (username, idiom_id, mode) VALUES ?',
      [values]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

// 오답노트 확장: 모드별 필터링 지원 추가
exports.getWrongAnswers = async (req, res) => {
  const { username } = req.params;
  const { mode } = req.query;
  try {
    let query = `
      SELECT i.id, i.word, i.reading, i.meaning 
      FROM wrong_answers w 
      JOIN idioms i ON w.idiom_id = i.id 
      WHERE w.username = ?`;

    const params = [username];

    if (mode) {
      query += ' AND w.mode = ?';
      params.push(mode);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

// 단어퀴즈(기본) 정답 제출 API (+10점)
exports.submitBasicQuiz = async (req, res) => {
  const { username, idiomId, isCorrect } = req.body;

  try {
    const table = isCorrect ? 'correct_answers' : 'wrong_answers';
    const query = `INSERT INTO ${table} (username, idiom_id, mode) VALUES (?, ?, 'basic')`;

    await db.query(query, [username, idiomId]);

    if (isCorrect) {
      await db.query('INSERT INTO scores (username, score) VALUES (?, ?)', [username, 10]);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};

// 유의어 퀴즈 출제 API
exports.getSynonymQuiz = async (req, res) => {
  const { username } = req.params;

  try {
    let idiom, synonymList;

    // 빈 synonymList가 나올 때까지 반복
    do {
      const [rows] = await db.query(`
        SELECT id, reading AS word, meaning, synonyms
        FROM idioms
        WHERE synonyms IS NOT NULL
          AND TRIM(synonyms) != ''
        ORDER BY RAND()
        LIMIT 1
      `);

      if (rows.length === 0) {
        return res.status(404).json({ error: '유의어가 있는 문제가 없습니다' });
      }
      idiom = rows[0];

      // 1) raw -> string
      let raw = idiom.synonyms;
      if (Buffer.isBuffer(raw)) raw = raw.toString();

      // 2) JS Array 변환
      if (Array.isArray(raw)) {
        synonymList = raw.map(w => (typeof w==='string'? w.trim(): '')).filter(w=>w);
      } else if (typeof raw === 'string') {
        const s = raw.trim();
        if (s.startsWith('[')) {
          try {
            const parsed = JSON.parse(s);
            synonymList = Array.isArray(parsed)
              ? parsed.map(w=> (typeof w==='string'? w.trim(): '')).filter(w=>w)
              : [];
          } catch {
            synonymList = [];
          }
        } else {
          synonymList = s.split(',').map(p=>p.trim()).filter(p=>p);
        }
      } else {
        synonymList = [];
      }

      // 반복 조건: 유효한 유의어 없으면 다시 뽑기
    } while (!synonymList || synonymList.length === 0);

    // 3) 최대 3개 랜덤 추출
    const correctAnswers = synonymList
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, synonymList.length));

       // **여기서 히스토리에 저장**
    await db.query(
      `INSERT INTO synonym_quiz_history (username, idiom_id, correct_answers)
       VALUES (?, ?, ?)`,
      [username, idiom.id, JSON.stringify(correctAnswers)]
    );

    // 4) 보기용 오답(reading) 뽑기
    const [wrongRows] = await db.query(`
      SELECT reading
      FROM idioms
      WHERE reading NOT IN (?)
        AND reading IS NOT NULL
        AND TRIM(reading) != ''
      ORDER BY RAND()
      LIMIT ?
    `, [[idiom.word, ...correctAnswers], 4 - correctAnswers.length]);

    const wrongWords = wrongRows.map(r => r.reading.trim());

    // 5) 최종 보기 옵션
    const options = [...correctAnswers, ...wrongWords]
      .map(w => ({ word: w, isCorrect: correctAnswers.includes(w) }))
      .sort(() => Math.random() - 0.5);

    // 6) 응답
    res.json({
      question: {
        id:   idiom.id,
        word: idiom.word,
        meaning: idiom.meaning
      },
      options,
      correctAnswers
    });

  } catch (err) {
    console.error('getSynonymQuiz error:', err);
    res.status(500).json({ error: 'DB Error' });
  }
};

// 유의어 퀴즈 정답 제출 API
exports.submitSynonymQuiz = async (req, res) => {
  const { username, idiomId, selectedWords } = req.body;
  try {
    // 1) 가장 최근 출제 이력 가져오기
    const [[history]] = await db.query(`
      SELECT correct_answers 
      FROM synonym_quiz_history
      WHERE username = ? AND idiom_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [username, idiomId]);
    if (!history) {
      return res.status(400).json({ error: '출제된 문제 이력이 없습니다' });
    }

    // 2) raw → string 보장
    let raw = history.correct_answers;
    if (Buffer.isBuffer(raw)) {
      raw = raw.toString('utf8');
    } else if (typeof raw !== 'string') {
      raw = String(raw);
    }
    raw = raw.trim();

    // 3) JSON 배열 파싱 시도 → 실패하면 CSV 파싱
    let correctAnswers;
    try {
      correctAnswers = JSON.parse(raw);
      if (!Array.isArray(correctAnswers)) throw new Error();
    } catch {
      correctAnswers = raw === ''
        ? []
        : raw.split(',').map(s => s.trim()).filter(s => s);
    }

    // 4) 채점
    const correctSet = new Set(correctAnswers);
    const selectedSet = new Set(selectedWords || []);
    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every(w => selectedSet.has(w));

    // 5) 정답/오답 기록
    const table = isCorrect ? 'correct_answers' : 'wrong_answers';
    await db.query(
      `INSERT INTO ${table} (username, idiom_id, mode) VALUES (?, ?, 'synonym')`,
      [username, idiomId]
    );
    if (isCorrect) {
      await db.query(
        'INSERT INTO scores (username, score) VALUES (?, 20)',
        [username]
      );
    }

    // 6) 결과 응답
    res.json({ result: isCorrect ? 'correct' : 'wrong', correctAnswers });

  } catch (err) {
    console.error('submitSynonymQuiz error:', err);
    res.status(500).send('채점 오류(DB)');
  }
};


// 한자 조합 문제 출제 API
exports.getHanjaQuiz = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, word, meaning
      FROM idioms
      WHERE (CHAR_LENGTH(word) = 4 OR LENGTH(word) = 12)
      ORDER BY RAND()
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: '문제 없음' });
    }

    const idiom = rows[0];
    const correctChars = idiom.word.split('');

    // alias를 hanja_char 로 바꿨습니다.
    const [wrongRows] = await db.query(`
      SELECT DISTINCT
        SUBSTRING(word, FLOOR(1 + RAND()*4), 1) AS hanja_char
      FROM idioms
      WHERE id != ? AND (CHAR_LENGTH(word) = 4 OR LENGTH(word) = 12)
      LIMIT 4
    `, [idiom.id]);

    const wrongChars = wrongRows.map(row => row.hanja_char);
    const allOptions = [...correctChars, ...wrongChars].sort(() => Math.random() - 0.5);

    res.json({
      question: {
        id: idiom.id,
        meaning: idiom.meaning,
        wordLength: 4
      },
      hanjaOptions: allOptions,
      correctAnswer: correctChars
    });
  } catch (err) {
    console.error('한자 퀴즈 오류:', err);
    res.status(500).send('DB Error');
  }
};

// 한자 조합 정답 제출 API
exports.submitHanjaQuiz = async (req, res) => {
  const { username, idiomId, selected } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT word FROM idioms WHERE id = ?',
      [idiomId]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: '사자성어 없음' });
    }

    const correct = rows[0].word.split('');
    const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);

    const table = isCorrect ? 'correct_answers' : 'wrong_answers';
    await db.query(
      `INSERT INTO ${table} (username, idiom_id, mode) VALUES (?, ?, 'hanja')`,
      [username, idiomId]
    );

    if (isCorrect) {
      await db.query(
        'INSERT INTO scores (username, score) VALUES (?, 10)',
        [username]
      );
    }

    res.json({ result: isCorrect ? 'correct' : 'wrong', correct });
  } catch (err) {
    console.error('submitHanjaQuiz error:', err);
    res.status(500).send('DB Error');
  }
};

exports.submitDailyAnswer = async (req, res) => {
  const { username, idiomId } = req.body;

  if (!username || !idiomId) {
    return res.status(400).json({ error: 'username 또는 idiomId가 누락되었습니다.' });
  }

  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const [[existing]] = await db.query(`
      SELECT * FROM daily_answers 
      WHERE username = ? AND date = ?
    `, [username, today]);

    if (existing) {
      return res.status(200).send('이미 오늘의 문제를 제출하셨습니다.');
    }

    await db.query(`
      INSERT INTO daily_answers (username, idiom_id, date)
      VALUES (?, ?, ?)
    `, [username, idiomId, today]);

    res.sendStatus(200);
  } catch (err) {
    console.error('daily submit error:', err);
    res.status(500).send('DB Error');
  }
};

// 오늘의 문제 API - GET
exports.getDailyIdiom = async (req, res) => {
  const { username } = req.params;

  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // 오늘 문제 푼 기록 있는지 확인
    const [[existing]] = await db.query(`
      SELECT i.id, i.reading AS word, i.meaning
      FROM daily_answers d
      JOIN idioms i ON d.idiom_id = i.id
      WHERE d.username = ? AND d.date = ?
    `, [username, today]);

    if (existing) {
      return res.json({ from: 'existing', idiom: existing });
    }

    // 새로운 문제 출제
    const [rows] = await db.query(`
      SELECT id, reading AS word, meaning
      FROM idioms
      ORDER BY difficulty = '하' DESC, difficulty = '중' DESC, RAND()
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: '문제 없음' });
    }

    const idiom = rows[0];
    res.json({ from: 'new', idiom });

  } catch (err) {
    console.error('getDailyIdiom error:', err);
    res.status(500).send('DB Error');
  }
};

// 오늘의 문제 달력 시각화용 기록 조회
exports.getDailyHistory = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT date
      FROM daily_answers
      WHERE username = ?
      ORDER BY date
    `, [username]);

    const dates = rows.map(row => {
      const kstDate = new Date(row.date.getTime() + 9 * 60 * 60 * 1000); // UTC → KST 보정
      return kstDate.toISOString().slice(0, 10);
    });

    res.json({ dates });
  } catch (err) {
    console.error('getDailyHistory error:', err);
    res.status(500).send('DB Error');
  }
};


// 진행률 표시용 API (예: 1/10)
exports.getProgress = async (req, res) => {
  const { username } = req.params;
  const { mode = 'basic' } = req.query; // 기본값은 'basic'

  try {
    // 총 문제 수
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM idioms`);

    // 사용자가 푼 문제 수 (정답 + 오답)
    const [[{ solved }]] = await db.query(`
      SELECT COUNT(DISTINCT idiom_id) AS solved
      FROM (
        SELECT idiom_id FROM correct_answers WHERE username = ? AND mode = ?
        UNION
        SELECT idiom_id FROM wrong_answers WHERE username = ? AND mode = ?
      ) AS combined
    `, [username, mode, username, mode]);

    res.json({
      solved,
      total,
      progressText: `${solved}/${total}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};