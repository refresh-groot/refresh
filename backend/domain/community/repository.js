const { CommunityPost, User, Comment } = require('../index'); // Comment 모델 추가
const { Op } = require('sequelize');

module.exports = {
  // findAll을 findAndCountAll로 변경하고 limit, offset 추가
  findAll: async ({ category, sort, search, page = 1 }) => {
    const limit = 10; // 한 페이지당 10개
    const offset = (page - 1) * limit;
    
    const where = {};
    if (category && category !== '전체') where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'likes') order = [['like_count', 'DESC']];
    if (sort === 'chat') order = [['comment_count', 'DESC']];

    // findAndCountAll을 써야 전체 개수(count)와 해당 페이지 데이터(rows)를 동시에 가져옵니다.
    return await CommunityPost.findAndCountAll({
      where,
      order,
      limit,   // 10개만 가져오기
      offset,  // 시작 지점 설정
      attributes: ['id', 'category', 'title', 'content', 'user_id', 'photo_url', 'like_count', 'comment_count', 'created_at'],
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }]
    });
  },

  create: async (data) => {
    return await CommunityPost.create(data);
  },

  findById: async (id) => {
    return await CommunityPost.findByPk(id, {
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }]
    });
  },

  delete: async (id, userId) => {
    return await CommunityPost.destroy({ where: { id, user_id: userId } });
  },

  // ---------------------------------------------------------
  // [추가] 5. 좋아요 토글 로직
  // ---------------------------------------------------------
  toggleLike: async (postId, userId) => {
    const post = await CommunityPost.findByPk(postId);
    if (!post) throw new Error('게시글을 찾을 수 없습니다.');

    // 사용자가 이미 좋아요를 눌렀는지 확인 (N:M 관계 메서드 사용)
    const hasLiked = await post.hasLiker(userId);

    if (hasLiked) {
      // 이미 눌렀다면 제거하고 카운트 감소
      await post.removeLiker(userId);
      await post.decrement('like_count', { by: 1 });
    } else {
      // 안 눌렀다면 추가하고 카운트 증가
      await post.addLiker(userId);
      await post.increment('like_count', { by: 1 });
    }

    // 변경된 최종 좋아요 수와 현재 유저의 좋아요 상태 반환
    const updatedPost = await CommunityPost.findByPk(postId, { attributes: ['like_count'] });
    return { likes: updatedPost.like_count, isLiked: !hasLiked };
  },

  // ---------------------------------------------------------
  // [추가] 6. 댓글 목록 조회
  // ---------------------------------------------------------
  findCommentsByPostId: async (postId) => {
    return await Comment.findAll({
      where: { post_id: postId },
      include: [{ model: User, as: 'Author', attributes: ['nickname'] }],
      order: [['created_at', 'ASC']] // 댓글은 오래된 순서대로 정렬
    });
  },

  // ---------------------------------------------------------
  // [추가] 7. 댓글 등록 및 카운트 업데이트
  // ---------------------------------------------------------
  createComment: async (postId, userId, content) => {
    // 1. 댓글 생성
    const comment = await Comment.create({
      post_id: postId,
      user_id: userId,
      content: content
    });

    // 2. 게시글의 댓글 수 1 증가
    await CommunityPost.increment('comment_count', { by: 1, where: { id: postId } });

    return comment;
  }
};