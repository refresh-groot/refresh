const Sequelize = require('sequelize');

class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        loginId: {
          type: Sequelize.STRING(255), 
          allowNull: false, 
          unique: true, 
          comment: '로그인 아이디',
        },
        password: {
          type: Sequelize.STRING(255), 
          allowNull: false, 
          comment: '암호화된 비밀번호',
        },
        nickname: {
          type: Sequelize.STRING(255), 
          unique: true,
          allowNull: false,
          comment: '사용자 닉네임',
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false, 
          comment: '사용자 이메일',
        },
        isAlertOn: { 
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true, 
          comment: '알림 수신 여부 (1: ON, 0: OFF)',
        },
        bio: {
          type: Sequelize.STRING(100), 
          allowNull: true,              
          defaultValue: '안녕하세요.', 
          comment: '한 줄 소개',
        },
        isAiDataAllowed: { 
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'AI 학습용 데이터(사진) 수집 동의 여부',
        },
        status: { 
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'ACTIVE',
          comment: '계정 상태 (ACTIVE, WITHDRAWN 등)',
        }
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: 'User',
        tableName: 'users',
        paranoid: false, 
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', 
      }
    );
  }
  
  static associate(db) {
    // 유저 탈퇴 시 등록한 식물 데이터 자동 삭제
    db.User.hasMany(db.Plant, { 
      foreignKey: 'user_id',
      sourceKey: 'id',
      onDelete: 'CASCADE', 
      hooks: true
    });

    // 유저 탈퇴 시 작성한 커뮤니티 게시글 자동 삭제
    db.User.hasMany(db.CommunityPost, { 
      foreignKey: 'user_id', 
      sourceKey: 'id', 
      onDelete: 'CASCADE' 
    });

    // 유저 탈퇴 시 작성한 커뮤니티 댓글 자동 삭제
    db.User.hasMany(db.Comment, { 
      foreignKey: 'user_id', 
      sourceKey: 'id', 
      onDelete: 'CASCADE' 
    });
  }
}

module.exports = User;