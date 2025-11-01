const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Create a comment
// @route   POST /api/posts/:postId/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      post: req.params.postId,
      content
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Populate user data
    await comment.populate('user', 'name username avatar');

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: req.params.postId });

    res.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:commentId/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      comment.likes.pull(req.user._id);
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.json({
      liked: !isLiked,
      likeCount: comment.likes.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or the post
    const post = await Post.findById(comment.post);
    const isPostOwner = post.user.toString() === req.user._id.toString();
    const isCommentOwner = comment.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createComment,
  getComments,
  likeComment,
  deleteComment
};