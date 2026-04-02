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
        //  세션 ID (채팅방 번호)
        session_id: {
            type: Sequelize.STRING(100),
            allowNull: true, // 기존 데이터 호환을 위해 true (나중에 필수로 변경 가능)
            comment: '대화 세션 ID (채팅방 식별자)',
        },
        image_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: '진단한 식물 이미지 경로(URL)',
        },
        question: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: '사용자 질문 또는 채팅 내용',
        },
        result: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: '진단 결과 (예: 잎마름병)',
        },
        recommendation: {
            type: Sequelize.TEXT,
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
          defaultValue: '새로운 상담',
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