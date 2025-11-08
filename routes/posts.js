const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/posts
// @desc    Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/posts
// @desc    Create a post
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const newPost = new Post({
      user: req.user.id,
      userName: user.name,
      userProfile: user.profilePicture,
      content: req.body.content,
      image: req.body.image || null
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.deleteOne();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    post.content = req.body.content || post.content;
    post.image = req.body.image || post.image;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/posts/like/:id
// @desc    Like a post
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if post already liked
    if (post.likes.includes(req.user.id)) {
      // Unlike
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    } else {
      // Like
      post.likes.unshift(req.user.id);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/posts/comment/:id
// @desc    Comment on a post
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);

    const newComment = {
      user: req.user.id,
      userName: user.name,
      text: req.body.text
    };

    post.comments.unshift(newComment);
    await post.save();
    
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;