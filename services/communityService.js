const db = require('../config/db');

exports.dbTest = async () => {
  const [rows] = await db.query('SELECT DATABASE() AS dbName');
  return rows[0];
};