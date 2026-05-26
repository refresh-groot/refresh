const repository = require('./repository');
const { CommunityPost, User, Comment } = require('../index');
const { Op } = require('sequelize');

module.exports = {
  getPosts: async (query) => {
    const { count, rows } = await repository.findAll({
      category: query.category,
      sort: query.sort,
      search: query.search,
      page: parseInt(query.page) || 1
    });
    
    const limit = 10;
    const totalPages = Math.ceil(count / limit);

    return {
      posts: rows.map(post => {
        const postJson = post.toJSON();
        return {
          id: postJson.id,
          category: postJson.category,
          title: postJson.title,
          preview: postJson.content.substring(0, 50),
          author: postJson.Author?.nickname || '알 수 없음',
          likes: postJson.like_count,
          comments: postJson.comment_count,
          date: postJson.created_at,
          image: postJson.photo_url,
          user_id: postJson.user_id
        };
      }),          // ← 여기 ), 닫아줘야 함
      totalPages,
      currentPage: parseInt(query.page) || 1
    };
  },

  createPost: async (userId, data) => {
    return await repository.create({ ...data, user_id: userId });
  },

  getPostDetail: async (id, userId) => {
    const post = await repository.findById(id);
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');

    const isLiked = userId ? await post.hasLiker(userId) : false;

    const relatedPosts = await CommunityPost.findAll({
      where: {
        category: post.category,
        id: { [Op.ne]: parseInt(id) }
      },
      order: [['created_at', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'category', 'like_count']
    });

    const postJson = post.toJSON();

    return {
      ...postJson,
      author: postJson.Author?.nickname,
      user_id: postJson.user_id || postJson.userId,
      isLiked,
      date: postJson.created_at,   // ← post → postJson으로 수정
      image: postJson.photo_url,   // ← post → postJson으로 수정
      relatedPosts: relatedPosts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        likes: p.like_count
      }))
    };
  },

  removePost: async (id, userId) => {
    const result = await repository.delete(id, userId);
    if (!result) throw new Error('게시글이 없거나 삭제 권한이 없습니다.');
    return result;
  },

  toggleLike: async (postId, userId) => {
    const post = await repository.findById(postId);
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');

    const isLiked = await post.hasLiker(userId);
    if (isLiked) {
      await post.removeLiker(userId);
      await post.decrement('like_count');
    } else {
      await post.addLiker(userId);
      await post.increment('like_count');
    }
    return { isLiked: !isLiked };
  },

  getComments: async (postId) => {
    const comments = await Comment.findAll({
      where: { post_id: postId },
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }],
      order: [['created_at', 'ASC']],
    });
    return comments.map(c => {
      const cJson = c.toJSON();   // ← toJSON 적용
      return {
        id: cJson.id,
        author: cJson.Author?.nickname || '알 수 없음',
        content: cJson.content,
        date: cJson.created_at,
      };
    });
  },

  createComment: async (postId, userId, content) => {
    const comment = await Comment.create({ post_id: postId, user_id: userId, content });
    await CommunityPost.increment('comment_count', { where: { id: postId } });
    const withAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }],
    });
    const withAuthorJson = withAuthor.toJSON();   // ← toJSON 적용
    return {
      id: withAuthorJson.id,
      author: withAuthorJson.Author?.nickname || '알 수 없음',
      content: withAuthorJson.content,
      date: withAuthorJson.created_at,
    };
  },
};