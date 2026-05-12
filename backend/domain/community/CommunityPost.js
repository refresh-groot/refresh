const Sequelize = require('sequelize');

class CommunityPost extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        category: {
          type: Sequelize.STRING(20),
          allowNull: false, // 질문, 자랑, 팁 등
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        photo_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        comment_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        }
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: 'CommunityPost',
        tableName: 'community_posts',
        paranoid: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.CommunityPost.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'id', as: 'Author' });
    db.CommunityPost.belongsToMany(db.User, { through: 'CommunityLike', as: 'Likers', foreignKey: 'post_id' });
    // 댓글 기능을 위해 나중에 Comment 모델과 연결할 수 있습니다.
  }
}

module.exports = CommunityPost;