const communityService = require('../services/communityService');

// 게시글 작성
exports.createPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'title, content는 필수입니다.',
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
    const userId = req.userId;

    const post = await communityService.getPostById({
      postId,
      userId,
    });

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
    const userId = req.userId;
    const { postId } = req.params;

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

// 댓글 작성
exports.createComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content는 필수입니다.',
      });
    }

    const comment = await communityService.createComment({
      postId,
      userId,
      content,
    });

    if (comment.status === 404) {
      return res.status(404).json({
        success: false,
        message: '게시글이 존재하지 않습니다.',
      });
    }

    res.status(201).json({
      success: true,
      message: '댓글이 작성되었습니다.',
      data: comment,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 댓글 목록 조회
exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const comments = await communityService.getCommentsByPostId({
      postId,
      userId,
    });

    res.json({
      success: true,
      data: comments,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId, commentId } = req.params;

    const result = await communityService.deleteComment({
      postId,
      commentId,
      userId,
    });

    if (result.status === 404) {
      return res.status(404).json({
        success: false,
        message: '댓글이 존재하지 않습니다.',
      });
    }

    if (result.status === 403) {
      return res.status(403).json({
        success: false,
        message: '댓글 삭제 권한이 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 게시글 좋아요 토글
exports.togglePostLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;

    const result = await communityService.togglePostLike({
      postId,
      userId,
    });

    if (result.status === 404) {
      return res.status(404).json({
        success: false,
        message: '게시글이 존재하지 않습니다.',
      });
    }

    res.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 댓글 좋아요 토글
exports.toggleCommentLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;

    const result = await communityService.toggleCommentLike({
      commentId,
      userId,
    });

    if (result.status === 404) {
      return res.status(404).json({
        success: false,
        message: '댓글이 존재하지 않습니다.',
      });
    }

    res.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 게시글 스크랩 토글
exports.togglePostScrap = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;

    const result = await communityService.togglePostScrap({
      postId,
      userId,
    });

    if (result.status === 404) {
      return res.status(404).json({
        success: false,
        message: '게시글이 존재하지 않습니다.',
      });
    }

    res.json({
      success: true,
      scrapped: result.scrapped,
      scrapCount: result.scrapCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 내 스크랩 목록 조회
exports.getMyScraps = async (req, res) => {
  try {
    const userId = req.userId;

    const scraps = await communityService.getMyScraps(userId);

    res.json({
      success: true,
      data: scraps,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};