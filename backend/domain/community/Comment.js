const Sequelize = require('sequelize');

class Comment extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: '댓글 내용',
        },
      },
      {
        sequelize,
        timestamps: true, // 생성 및 수정 시간 자동 기록
        underscored: true, // 테이블 컬럼명을 snake_case로 설정
        modelName: 'Comment',
        tableName: 'community_comments',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    // 1. 댓글은 특정 사용자(작성자)에게 속함
    db.Comment.belongsTo(db.User, { 
      foreignKey: 'user_id', 
      as: 'Author',
      onDelete: 'CASCADE' // 유저 탈퇴 시 댓글도 삭제
    });

    // 2. 댓글은 특정 게시글에 속함
    db.Comment.belongsTo(db.CommunityPost, { 
      foreignKey: 'post_id',
      onDelete: 'CASCADE' // 게시글 삭제 시 댓글도 삭제
    });
  }
}

module.exports = Comment;