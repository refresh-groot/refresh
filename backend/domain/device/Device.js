const Sequelize = require('sequelize');

class Device extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        device_serial: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'MAC 주소',
        },
        operation_mode: {
          type: Sequelize.BOOLEAN, 
          allowNull: false,
          defaultValue: true,    //기본값 자동
          comment: '현재 작동 모드 (true: 자동, false: 수동)',
        },
        current_moisture: { 
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: '현재 토양 수분값'
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'error'),
          defaultValue: 'active',
        },
        last_connect: { 
            type: Sequelize.DATE,
            allowNull: true,
            comment: '마지막 통신 시간'
        }
      },
      {
        sequelize,
        timestamps: true, // createdAt, updatedAt
        underscored: true,
        modelName: 'Device',
        tableName: 'devices',
        paranoid: false, // 기기는 삭제하면 진짜 삭제하는 게 나음 (선택사항)
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Device.belongsTo(db.Plant, { foreignKey: 'plant_id', targetKey: 'id' });
  }
}

module.exports = Device;
