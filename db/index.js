// index.js 
const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '10041004',
  database: 'idiom_game',
});

module.exports = pool.promise();
