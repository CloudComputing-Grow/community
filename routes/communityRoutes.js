const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');
const requireUser = require('../middlewares/requireUser');

// 게시글
router.post('/posts', requireUser, communityController.createPost);
router.get('/posts', requireUser, communityController.getPosts);
router.get('/posts/:postId', requireUser, communityController.getPostById);
router.delete('/posts/:postId', requireUser, communityController.deletePost);

// 댓글
router.get('/posts/:postId/comments', requireUser, communityController.getCommentsByPostId);
router.post('/posts/:postId/comments', requireUser, communityController.createComment);
router.delete('/posts/:postId/comments/:commentId', requireUser, communityController.deleteComment);

// 좋아요
router.post('/posts/:postId/like', requireUser, communityController.togglePostLike);
router.post('/comments/:commentId/like', requireUser, communityController.toggleCommentLike);

// 스크랩
router.post('/posts/:postId/scrap', requireUser, communityController.togglePostScrap);
router.get('/scraps', requireUser, communityController.getMyScraps);

module.exports = router;