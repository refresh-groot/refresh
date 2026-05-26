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
      }),         
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
      date: postJson