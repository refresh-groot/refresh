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

  // ---------------------------------------------------------
  // [추가] 5. 좋아요 토글 컨트롤러
  // ---------------------------------------------------------
  toggleLike: async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }
      const userId = req.session.user.id;
      const result = await service.toggleLike(req.params.id, userId);
      res.json(result); // { likes, isLiked } 반환
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },

  // ---------------------------------------------------------
  // [추가] 6. 댓글 목록 조회 컨트롤러
  // ---------------------------------------------------------
  getComments: async (req, res) => {
    try {
      const comments = await service.getComments(req.params.id);
      res.json(comments);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },

  // ---------------------------------------------------------
  // [추가] 7. 댓글 등록 컨트롤러
  // ---------------------------------------------------------
  createComment: async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }
      const userId = req.session.user.id;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      }

      const comment = await service.addComment(req.params.id, userId, content);
      res.status(201).json(comment);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
};