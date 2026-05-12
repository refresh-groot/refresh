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
          unique: true, // 아이디 중복 불가
          comment: '로그인 아이디',
        },
        password: {
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: '암호화된 비밀번호',
        },
        nickname: {
          type: Sequelize.STRING(255), 
          unique: true, // 닉네임 중복 불가
          allowNull: false,
          comment: '사용자 닉네임',
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: '사용자 이메일',
        },
        is_alert_on: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true, 
          comment: '알림 수신 여부 (1: ON, 0: OFF)',
        },
        bio: {
          type: Sequelize.STRING(100), 
          allowNull: true,              
          defaultValue: '안녕하세요.',            // 기본값
          comment: '한 줄 소개',
        },
        provider: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'local', // 일반가입은 local, 소셜은 kakao, google, naver, github
          comment: '가입 경로',
        },
        sns_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: '소셜 로그인 고유 식별자',
        }
      },
      {
        sequelize,
        timestamps: true, // created_at 자동 생성 (ERD의 created_at 대응)
        underscored: true, // 컬럼명을 스네이크 케이스로 (loginId -> login_id)
        modelName: 'User',
        tableName: 'users',
        paranoid: false, // 삭제 시 복구 불가.
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }
  
  static associate(db) {
    db.User.hasMany(db.Plant, { 
      foreignKey: 'user_id', //  Plant.js와 똑같이 'user_id'로
      sourceKey: 'id',
      // 연쇄 삭제 설정 (Cascade)
      onDelete: 'CASCADE', // DB에서 유저 삭제 시 식물 데이터 자동 삭제
      hooks: true
    });

    // [추가] 유저 탈퇴 시 작성한 커뮤니티 게시글도 함께 삭제
    db.User.hasMany(db.CommunityPost, { 
      foreignKey: 'user_id', 
      sourceKey: 'id', 
      onDelete: 'CASCADE' 
    });

    // [추가] 유저 탈퇴 시 작성한 커뮤니티 댓글도 함께 삭제
    db.User.hasMany(db.Comment, { 
      foreignKey: 'user_id', 
      sourceKey: 'id', 
      onDelete: 'CASCADE' 
    });
  }
}

module.exports = User;