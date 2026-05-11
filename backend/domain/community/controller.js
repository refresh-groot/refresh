const service = require('./service');

module.exports = {
  getPosts: async (req, res) => {
    try {
      const posts = await service.getPosts(req.query);
      res.json(posts);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },

  createPost: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { category, title, content } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      const post = await service.createPost(userId, { category, title, content, photo_url: image });
      res.status(201).json(post);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },

  getPostDetail: async (req, res) => {
    try {
      const userId = req.session.user?.id;
      const post = await service.getPostDetail(req.params.id, userId);
      res.json(post);
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const userId = req.session.user.id;
      await service.removePost(req.params.id, userId);
      res.json({ message: '삭제 완료' });
    } catch (e) {
      res.status(403).json({ message: e.message });
    }
  },

  toggleLike: async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await service.toggleLike(req.params.id, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
},

getComments: async (req, res) => {
  try {
    const comments = await service.getComments(req.params.id);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
},

createComment: async (req, res) => {
  try {
    const userId = req.session.user.id;
    const comment = await service.createComment(req.params.id, userId, req.body.content);
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
},
};