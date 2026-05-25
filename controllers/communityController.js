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

// 게시글 작성
exports.createPost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    const { title, content } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, content는 필수입니다.',
      });
    }

    const post = await communityService.createPost({
      userId,
      title,
      content,
    });

    res.status(201).json({
      success: true,
      message: '게시글이 작성되었습니다.',
      data: post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 게시글 목록 조회 / 검색
exports.getPosts = async (req, res) => {
  try {
    const { search } = req.query;

    const posts = await communityService.getPosts(search);

    res.json({
      success: true,
      data: posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 게시글 상세 조회
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await communityService.getPostById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId가 필요합니다.',
      });
    }

    const result = await communityService.deletePost({
      postId,
      userId,
    });

    if (result.status === 404) {
      return res.status(404).json({
        success: false,
        message: '게시글이 존재하지 않습니다.',
      });
    }

    if (result.status === 403) {
      return res.status(403).json({
        success: false,
        message: '게시글 삭제 권한이 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};