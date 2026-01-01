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
          type: Sequelize.STRING(100), // 길이를 100으로 확장 (ERD 반영)
          allowNull: false,
          comment: '사용자가 지어준 식물 애칭 (프론트 nickname)',
        },
        species: {
          type: Sequelize.STRING(100),
          allowNull: false,
          references: {
            model: 'species_info', // 참조할 테이블 이름
            key: 'species_name',   // 참조할 테이블의 컬럼 이름
          },
          onUpdate: 'CASCADE', // SpeciesInfo의 이름이 바뀌면 같이 바뀜
          onDelete: 'CASCADE', // SpeciesInfo에서 삭제되면 같이 삭제 (혹은 SET NULL)
          comment: '식물 종류 (프론트 name)',
        },
        reg_date: { // adoption_date에서 reg_date로 변경 (ERD 일치)
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: '식물 등록일 (프론트 startDate)',
        },
        photo_url: { // 새로 추가
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: '식물 사진 URL (프론트 img)',
        },
        status: { // 새로 추가 (3단계 삭제 로직용)
          type: Sequelize.ENUM('active', 'archived', 'deleted'),
          defaultValue: 'active',
          allowNull: false,
          comment: '식물 상태 (활성, 보관함, 삭제 대기)',
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: 'Plant',
        tableName: 'plants',
        paranoid: true, // Soft Delete 지원 (deleted_at)
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Plant.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'id' });
    
    // 추가: 식물 종 정보를 통해 가이드(SpeciesInfo)를 가져올 수 있게 연결
    db.Plant.belongsTo(db.SpeciesInfo, { 
      foreignKey: 'species',   // Plant의 species 컬럼 사용
      targetKey: 'species_name', // SpeciesInfo의 PK 사용
      as: 'guide' // 데이터 조회 시 'guide'라는 이름으로 붙여줌
    });

    db.Plant.hasOne(db.Device, { foreignKey: 'plant_id', sourceKey: 'id' });
    db.Plant.hasMany(db.DiagnosisLog, { foreignKey: 'plant_id', sourceKey: 'id' });
    db.Plant.hasMany(db.WateringLog, { foreignKey: 'plant_id', sourceKey: 'id' });
  }
}

module.exports = Plant;