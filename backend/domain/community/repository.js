const { CommunityPost, User } = require('../index');
const { Op } = require('sequelize');

module.exports = {
  // 게시글 목록 조회 (필터 및 검색)
  findAll: async ({ category, sort, search }) => {
    const where = {};
    if (category && category !== '전체') where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    let order = [['created_at', 'DESC']]; // 기본 최신순
    if (sort === 'likes') order = [['like_count', 'DESC']];

    return await CommunityPost.findAll({
      where,
      order,
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
  }
};