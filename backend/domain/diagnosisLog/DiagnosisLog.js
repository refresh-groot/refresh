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
          allowNull: false,
          comment: '진단한 식물 이미지 경로(URL)',
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
          comment: 'AI 진단 확신도 (0.0 ~ 1.0)',
        },
        diagnosis_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '진단 일시',
        },
      },
      {
        sequelize,
        timestamps: true,
        updatedAt: false,
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
