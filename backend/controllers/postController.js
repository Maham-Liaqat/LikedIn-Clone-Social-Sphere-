const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;

    const post = await Post.create({
      user: req.user._id,
      content,
      image
    });

    // Populate user data
    await post.populate('user', 'name username avatar');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from users that current user follows + their own posts
    const currentUser = await User.findById(req.user._id);
    const followingUsers = [...currentUser.following, currentUser._id];

    const posts = await Post.find({ user: { $in: followingUsers } })
      .populate('user', 'name username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 2 }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: { $in: followingUsers } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 2 }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: req.params.userId });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:postId
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username avatar'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:postId/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      post.likes.pull(req.user._id);
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      liked: !isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:postId
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get posts liked by user
// @route   GET /api/posts/liked/:userId
// @access  Public
const getLikedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ likes: req.params.userId })
      .populate('user', 'name username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 2 }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ likes: req.params.userId });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Get liked posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getUserPosts,
  getPost,
  likePost,
  deletePost,
  getLikedPosts
};