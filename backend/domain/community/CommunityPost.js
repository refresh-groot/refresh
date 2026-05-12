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
    // [수정] onDelete: 'CASCADE' 추가 (유저 탈퇴 시 작성한 게시글 자동 삭제)
    db.CommunityPost.belongsTo(db.User, { 
      foreignKey: 'user_id', 
      targetKey: 'id', 
      as: 'Author', 
      onDelete: 'CASCADE' 
    });

    // [수정] onDelete: 'CASCADE' 추가 (유저 탈퇴 시 해당 게시글에 누른 좋아요 기록 자동 삭제)
    db.CommunityPost.belongsToMany(db.User, { 
      through: 'CommunityLike', 
      as: 'Likers', 
      foreignKey: 'post_id', 
      onDelete: 'CASCADE' 
    });

    // 댓글 기능을 위해 나중에 Comment 모델과 연결할 수 있습니다.
    // [추가] 게시글 삭제 시 관련 댓글도 모두 삭제되도록 연결
    db.CommunityPost.hasMany(db.Comment, { 
      foreignKey: 'post_id', 
      sourceKey: 'id', 
      as: 'Comments', 
      onDelete: 'CASCADE' 
    });
  }
}

module.exports = CommunityPost;