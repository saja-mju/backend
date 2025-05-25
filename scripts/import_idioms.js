// backend/scripts/import_idioms.js

const fs = require('fs');
const path = require('path');
const pool = require('../db/index'); // DB 연결 설정

async function importIdioms() {
  try {
    const filePath = path.join(__dirname, '../idioms_final_with_difficulty.json'); // 또는 idioms_full_600.json 경로로 수정
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const insertQuery = `
      INSERT INTO idioms (id, word, meaning, reading, synonyms, antonyms, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const idiom of data) {
      const {
        id,
        word,
        meaning,
        reading = null,
        synonyms = null,
        antonyms = null,
        difficulty = null
      } = idiom;

      await pool.execute(insertQuery, [
        id,
        word,
        meaning,
        reading,
        synonyms,
        antonyms,
        difficulty
      ]);
    }

    console.log('✅ 사자성어 600개가 성공적으로 삽입되었습니다!');
    process.exit();
  } catch (err) {
    console.error('❌ 삽입 실패:', err);
    process.exit(1);
  }
}

importIdioms();
