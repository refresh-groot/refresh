const Sequelize = require('sequelize');

class DiagnosisLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        image_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: '진단한 식물 이미지 경로(URL)',
        },
        question: {
            type: Sequelize.TEXT, // 질문이 길 수 있으니 TEXT
            allowNull: true,      // 질문 없이 사진만 보낼 수도 있으니 true
            comment: '사용자 질문 또는 채팅 내용',
        },
        result: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: '진단 결과 (예: 잎마름병)',
        },
        recommendation: {
            type: Sequelize.TEXT, // 내용이 길 수 있으니 TEXT 타입
            allowNull: true,
            comment: 'AI 권장 조치 사항',
        },
        confidence: {
          type: Sequelize.FLOAT,
          allowNull: false,
          comment: 'AI 진단 정확도 (0.0 ~ 1.0)',
        },
        diagnosis_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '진단 일시',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: '진단 결과', 
          comment: '진단방 제목',
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'DiagnosisLog',
        tableName: 'diagnosis_logs',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.DiagnosisLog.belongsTo(db.Plant, { foreignKey: 'plant_id', targetKey: 'id' });
  }
}

module.exports = DiagnosisLog;
