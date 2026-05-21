const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  publishPost,
  schedulePost,
  getDueScheduledPosts,
  updatePostAnalytics
} = require('../controllers/postController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/create', createPost);
router.get('/:shopId', getPosts);
router.get('/post/:id', getPostById);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/publish', publishPost);
router.post('/:id/schedule', schedulePost);
router.post('/:id/analytics', updatePostAnalytics);

// Cron route - public but use secret key
router.get('/scheduled/due', getDueScheduledPosts);

module.exports = router;