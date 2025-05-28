// routes/viewed.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/view', async (req, res) => {
  const { username, idiom_id } = req.body;
  try {
    await db.query(
      'INSERT IGNORE INTO viewed_cards (username, idiom_id) VALUES (?, ?)',
      [username, idiom_id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
});

module.exports = router;
