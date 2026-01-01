// backend/domain/plant/SpeciesInfo.js
const Sequelize = require('sequelize');

class SpeciesInfo extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      species_name: { // 식물 종 이름 (PK)
        type: Sequelize.STRING(100),
        primaryKey: true,
        allowNull: false,
      },
      watering_guide: { // 물주기 가이드
        type: Sequelize.TEXT,
        allowNull: true,
      },
      env_guide: { // 환경 가이드 (햇빛 등)
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mini_tip: { // 로딩 중 보여줄 미세 팁
        type: Sequelize.STRING(255),
        allowNull: true,
      }
    }, {
      sequelize,
      underscored: true,
      modelName: 'SpeciesInfo',
      tableName: 'species_info',
      timestamps: false, // 정적 데이터라 생성 시간 불필요
    });
  }
}
module.exports = SpeciesInfo;