const repository = require('./repository');
const { CommunityPost, User, Comment } = require('../index');
const { Op } = require('sequelize');

module.exports = {
  getPosts: async (query) => {
    // 1. 리포지토리에 명시적으로 page 값을 포함하여 전달
    const { count, rows } = await repository.findAll({
      category: query.category,
      sort: query.sort,
      search: query.search,
      page: parseInt(query.page) || 1
    });
    
    const limit = 10;
    const totalPages = Math.ceil(count / limit);

    return {
      posts: rows.map(post => ({
        id: post.id,
        category: post.category,
        title: post.title,
        preview: post.content.substring(0, 50),
        author: post.Author?.nickname || '알 수 없음',
        likes: post.like_count,
        comments: post.comment_count,
        date: post.created_at || created_At,
        image: post.photo_url,
        user_id: post.user_id
      })),
      totalPages: totalPages,
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

    // postData 오타 수정 및 안전한 데이터 변환
    const postJson = post.toJSON();

    return {
      ...postJson,
      author: post.Author?.nickname,
      user_id: postJson.user_id || postJson.userId, // postJson 사용
      isLiked,
      date: post.created_at || created_At,
      image: post.photo_url,
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
    return comments.map(c => ({
      id: c.id,
      author: c.Author?.nickname || '알 수 없음',
      content: c.content,
      date: c.created_at || created_At,
    }));
  },

  createComment: async (postId, userId, content) => {
    const comment = await Comment.create({ post_id: postId, user_id: userId, content });
    await CommunityPost.increment('comment_count', { where: { id: postId } });
    const withAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }],
    });
    return {
      id: withAuthor.id,
      author: withAuthor.Author?.nickname || '알 수 없음',
      content: withAuthor.content,
      date: withAuthor.created_at,
    };
  },
};