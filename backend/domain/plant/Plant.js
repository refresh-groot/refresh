const Sequelize = require('sequelize');

class Plant extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        plant_name: {
          type: Sequelize.STRING(30),
          allowNull: false,
          comment: '사용자가 지어준 식물 애칭',
        },
        species: {
          type: Sequelize.STRING(30),
          allowNull: false,
          comment: '식물 종류 (예: 몬스테라)',
        },
        adoption_date: {
          type: Sequelize.DATEONLY, // 날짜만 저장 (YYYY-MM-DD)
          allowNull: false,
          comment: '식물 입양일(키우기 시작한 날)',
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: 'Plant',
        tableName: 'plants',
        paranoid: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Plant.belongsTo(db.User, { 
      foreignKey: 'userId', 
      targetKey: 'id', 
      onDelete: 'CASCADE' 
    });
    // Plant는 하나의 Device와 연결된다 (1:1)
    db.Plant.hasOne(db.Device, { foreignKey: 'plant_id', sourceKey: 'id' });
    // Plant는 여러 진단 기록을 가진다 (1:N)
    db.Plant.hasMany(db.DiagnosisLog, { foreignKey: 'plant_id', sourceKey: 'id' });
    // Plant는 여러 물주기 기록을 가진다 (1:N)
    db.Plant.hasMany(db.WateringLog, { foreignKey: 'plant_id', sourceKey: 'id' });
  }
}

module.exports = Plant;
