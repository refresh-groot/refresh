const Sequelize = require('sequelize');

class EnvironmentLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        plant_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: '대상 식물 고유 ID',
        },
        temperature: {
          type: Sequelize.FLOAT,
          allowNull: true,
          comment: '현재 온도',
        },
        light_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '현재 조도 값',
        },
        moisture_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '현재 토양 수분값',
        },
      },
      {
        sequelize,
        timestamps: true, // createdAt을 통해 기록 시간 자동 관리
        updatedAt: false,
        underscored: true,
        modelName: 'EnvironmentLog',
        tableName: 'environment_logs',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.EnvironmentLog.belongsTo(db.Plant, { 
        foreignKey: 'plant_id', 
        targetKey: 'id',
        onDelete: 'CASCADE' 
    });
  }
}

module.exports = EnvironmentLog;