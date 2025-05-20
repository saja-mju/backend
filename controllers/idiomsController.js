const db = require('../db');

exports.getIdioms = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM idioms ORDER BY RAND() LIMIT 10');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Error');
  }
};
