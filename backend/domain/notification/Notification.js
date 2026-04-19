// domain/notification/Notification.js
const Sequelize = require('sequelize');

class Notification extends Sequelize.Model {
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
          comment: '알림 대상 식물 ID',
        },
        type: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: '알림 유형 (ERROR, SUCCESS, INFO)',
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: '사용자에게 노출될 알림 메시지',
        },
        captured_value: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: '알림 발생 당시의 핵심 데이터 값',
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: '사용자 읽음 여부',
        },
      },
      {
        sequelize,
        timestamps: true, // 알림 발생 시간 관리를 위해 true 유지
        updatedAt: false,
        underscored: true,
        modelName: 'Notification',
        tableName: 'notifications',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Notification.belongsTo(db.Plant, { 
        foreignKey: 'plant_id', 
        targetKey: 'id',
        onDelete: 'CASCADE' 
    });
  }
}

module.exports = Notification;