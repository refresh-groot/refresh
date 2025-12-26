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
          unique: true, // 이메일 중복 불가
          comment: '사용자 이메일',
        },
      },
      {
        sequelize,
        timestamps: true, // created_at 자동 생성 (ERD의 created_at 대응)
        underscored: true, // 컬럼명을 스네이크 케이스로 (loginId -> login_id)
        modelName: 'User',
        tableName: 'users',
        paranoid: true, // 삭제 시 복구 가능하도록 deleted_at 생성 (선택사항)
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    // User는 여러 Plant를 가질 수 있다 (1:N)
    db.User.hasMany(db.Plant, { foreignKey: 'user_id', sourceKey: 'id' });
  }
}

module.exports = User;