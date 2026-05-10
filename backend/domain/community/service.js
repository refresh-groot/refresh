const repository = require('./repository');

module.exports = {
  getPosts: async (query) => {
    const posts = await repository.findAll(query);
    // 명세서에 맞는 형식으로 변환
    return posts.map(post => ({
      id: post.id,
      category: post.category,
      title: post.title,
      preview: post.content.substring(0, 50), // 앞부분 50자만 미리보기
      author: post.Author?.nickname || '알 수 없음',
      likes: post.like_count,
      comments: post.comment_count,
      date: post.created_at,
      image: post.photo_url
    }));
  },

  createPost: async (userId, data) => {
    return await repository.create({ ...data, user_id: userId });
  },

  getPostDetail: async (id, userId) => {
    const post = await repository.findById(id);
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');

    // 상세 보기에서는 본인이 좋아요를 눌렀는지 여부(isLiked)도 확인
    const isLiked = userId ? await post.hasLiker(userId) : false;

    return {
      ...post.toJSON(),
      author: post.Author?.nickname,
      isLiked,
      date: post.created_at,
      image: post.photo_url
    };
  },

  removePost: async (id, userId) => {
    const result = await repository.delete(id, userId);
    if (!result) throw new Error('게시글이 없거나 삭제 권한이 없습니다.');
    return result;
  }
};