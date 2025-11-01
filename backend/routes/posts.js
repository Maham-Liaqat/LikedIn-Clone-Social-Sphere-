const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Helper function to check database connection
const checkDBConnection = () => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    throw new Error('Database connection unavailable. Please try again in a moment.');
  }
  return true;
};

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = new Post({
      content: content.trim(),
      author: req.user.userId,
      image: req.file ? req.file.filename : ''
    });

    await post.save();
    await post.populate('author', 'name profilePicture');

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    
    // Repopulate the post data
    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      });
      
    res.json(updatedPost);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment 
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log('=== COMMENT REQUEST ===');
    console.log('Post ID:', req.params.id);
    console.log('User ID:', req.user.userId);
    console.log('Comment text:', text);
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Check if post ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid post ID format');
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    // Find the post and update in one operation with proper population
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.user.userId,
            text: text.trim(),
            createdAt: new Date()
          }
        }
      },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('author', 'name profilePicture')
    .populate({
      path: 'comments.user',
      select: 'name profilePicture',
      model: 'User'
    });

    if (!post) {
      console.log('Post not found in database');
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Comment added successfully');
    console.log('Updated comments count:', post.comments.length);
    
    res.json(post);
  } catch (error) {
    console.error('=== ERROR ADDING COMMENT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to add comment', 
      error: error.message 
    });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.userId },
      { content: content.trim() },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('author', 'name profilePicture')
    .populate({
      path: 'comments.user',
      select: 'name profilePicture',
      model: 'User'
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user.userId
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug route to check post existence (optional - can remove in production)
router.get('/debug/:id', auth, async (req, res) => {
  try {
    console.log('Debug request for post:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Invalid ObjectId format' 
      });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      });

    if (!post) {
      return res.status(404).json({ 
        exists: false, 
        message: 'Post not found in database' 
      });
    }

    res.json({ 
      exists: true, 
      post: {
        id: post._id,
        content: post.content,
        author: post.author,
        commentsCount: post.comments.length,
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike comment
router.post('/:postId/comments/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user.userId;
    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await post.save();
    
    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete comment
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete (comment author or post author)
    if (comment.user.toString() !== req.user.userId && post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add reply to comment
router.post('/:postId/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user.userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name profilePicture',
        model: 'User'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name profilePicture',
        model: 'User'
      });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;