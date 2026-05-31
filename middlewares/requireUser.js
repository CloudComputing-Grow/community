const requireUser = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.body.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '인증된 사용자 정보가 없습니다.',
    });
  }

  req.userId = Number(userId);
  next();
};

module.exports = requireUser;