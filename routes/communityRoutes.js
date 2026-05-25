const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');

router.get('/db-test', communityController.dbTest);

// 게시글
router.post('/posts', communityController.createPost);
router.get('/posts', communityController.getPosts);
router.get('/posts/:postId', communityController.getPostById);
router.delete('/posts/:postId', communityController.deletePost);

// 댓글
router.post('/posts/:postId/comments', communityController.createComment);
router.delete('/posts/:postId/comments/:commentId', communityController.deleteComment);

module.exports = router;