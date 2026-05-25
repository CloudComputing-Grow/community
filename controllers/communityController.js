const communityService = require('../services/communityService');

exports.dbTest = async (req, res) => {
  try {
    const result = await communityService.dbTest();

    res.json({
      success: true,
      database: result.dbName,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};