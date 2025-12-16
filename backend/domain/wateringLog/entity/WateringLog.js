const Sequelize = require('sequelize');

class WateringLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        // 1. 물 줄 당시 펌프가 몇 초 동안 돌았는지 (ml 단위 대신 시간으로 기록)
        duration_sec: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '펌프 작동 시간(초)',
        },
        // 2. 자동 급수인지 수동 급수인지 기록
        is_auto: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true, // 기본값 자동
          comment: 'true: 자동, false: 수동',
        },
        // 3. 물 줄 당시의 토양 습도 기록 
        moisture_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '물 줄 당시 토양 수분값',
        },
        // 4. 기록 시간 
        watering_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '물 준 일시',
        },
      },
      {
        sequelize,
        timestamps: true,
        updatedAt: false,
        underscored: true,
        modelName: 'WateringLog',
        tableName: 'watering_logs',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.WateringLog.belongsTo(db.Plant, { foreignKey: 'plant_id', targetKey: 'id' });
  }
}

module.exports = WateringLog;