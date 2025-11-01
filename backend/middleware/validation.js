const validateRegister = (req, res, next) => {
    const { name, username, email, password } = req.body;
  
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
  
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
  
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
  
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
  
    next();
  };
  
  const validatePost = (req, res, next) => {
    const { content } = req.body;
  
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content cannot be empty' });
    }
  
    if (content.length > 2000) {
      return res.status(400).json({ message: 'Post cannot exceed 2000 characters' });
    }
  
    next();
  };
  
  const validateComment = (req, res, next) => {
    const { content } = req.body;
  
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }
  
    if (content.length > 500) {
      return res.status(400).json({ message: 'Comment cannot exceed 500 characters' });
    }
  
    next();
  };
  
  module.exports = {
    validateRegister,
    validatePost,
    validateComment
  };