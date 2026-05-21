const Post = require('../models/Post');
const mongoose = require('mongoose');

// @desc Create AI generated post
// @route POST /api/posts/create
// @access Private
const createPost = async (req, res, next) => {
  try {
    const { shopId, productId, content, generation } = req.body;

    if (!shopId || !content?.fullPost) {
      return res.status(400).json({ error: 'shopId and content.fullPost required' });
    }

    const post = await Post.create({
      shopId,
      productId,
      content,
      generation,
      createdBy: 'ai',
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get posts for a shop
// @route GET /api/posts/:shopId?status=draft&page=1&limit=10
// @access Private
const getPosts = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { shopId };
    if (status) query.status = status;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('productId', 'name price image')
        .select('-__v'),
      Post.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get single post
// @route GET /api/posts/post/:id
// @access Private
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('productId', 'name price');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update post
// @route PUT /api/posts/:id
// @access Private
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc Delete post
// @route DELETE /api/posts/:id
// @access Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc Mark post as published
// @route POST /api/posts/:id/publish
// @access Private
const publishPost = async (req, res, next) => {
  try {
    const { platform, postId } = req.body;

    if (!platform || !postId) {
      return res.status(400).json({ error: 'platform and postId required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.isPublishable) {
      return res.status(400).json({ error: 'Post is not publishable' });
    }

    await post.markPublished(platform, postId);

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc Schedule post
// @route POST /api/posts/:id/schedule
// @access Private
const schedulePost = async (req, res, next) => {
  try {
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({ error: 'scheduledFor date required' });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor)
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get scheduled posts for cron
// @route GET /api/posts/scheduled/due
// @access Private - called by cron
const getDueScheduledPosts = async (req, res, next) => {
  try {
    const now = new Date();

    const posts = await Post.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).limit(50);

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update post analytics
// @route POST /api/posts/:id/analytics
// @access Private
const updatePostAnalytics = async (req, res, next) => {
  try {
    const { views, likes, comments, shares } = req.body;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        'analytics.views': views || 0,
        'analytics.likes': likes || 0,
        'analytics.comments': comments || 0,
        'analytics.shares': shares || 0,
        'analytics.lastUpdated': new Date()
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  publishPost,
  schedulePost,
  getDueScheduledPosts,
  updatePostAnalytics
};