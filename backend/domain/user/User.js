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
          allowNull: true, // 소셜 로그인의 경우 loginId가 없을 수 있으므로 true
          unique: true, 
          comment: '로그인 아이디 (일반 로그인용)',
        },
        password: {
          type: Sequelize.STRING(255), 
          allowNull: true, // 소셜 로그인의 경우 비밀번호가 없으므로 true
          comment: '암호화된 비밀번호 (일반 로그인용)',
        },
        nickname: {
          type: Sequelize.STRING(255), 
          unique: true, // 닉네임 중복 불가
          allowNull: false,
          comment: '사용자 닉네임',
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true, // 소셜 로그인 시 이메일 동의를 안 할 수도 있으므로 true
          comment: '사용자 이메일',
        },
        isAlertOn: { // 자바스크립트 네이밍 컨벤션(카멜케이스)으로 변경
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true, 
          comment: '알림 수신 여부 (1: ON, 0: OFF)',
        },
        bio: {
          type: Sequelize.STRING(100), 
          allowNull: true,              
          defaultValue: '안녕하세요.', // 기본값
          comment: '한 줄 소개',
        },
        provider: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'local', // 일반가입은 local, 소셜은 kakao, google, naver, github 등
          comment: '가입 경로',
        },
        snsId: { // 자바스크립트 네이밍 컨벤션(카멜케이스)으로 변경
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: '소셜 로그인 고유 식별자',
        },
        isAiDataAllowed: { // AI 진단 이미지 학습 동의 여부 추가
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'AI 학습용 데이터(사진) 수집 동의 여부',
        },
        status: { // 회원 탈퇴 및 관리용 상태 컬럼 추가
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'ACTIVE',
          comment: '계정 상태 (ACTIVE, WITHDRAWN 등)',
        }
      },
      {
        sequelize,
        timestamps: true, // created_at, updated_at 자동 생성
        underscored: true, // DB 컬럼명을 스네이크 케이스로 매핑 (loginId -> login_id)
        modelName: 'User',
        tableName: 'users',
        paranoid: false, // 삭제 시 복구 불가 (hard delete)
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', // 이모지 저장 지원
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