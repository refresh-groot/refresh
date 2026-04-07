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
      // --- [지능형 알림을 위한 기준 임계값(Threshold) 추가] ---
      min_moisture: { 
        type: Sequelize.INTEGER, 
        defaultValue: 30, // 기본값 30%
        comment: '알림을 보낼 최소 수분 수치' 
      },
      max_temp: { 
        type: Sequelize.FLOAT, 
        defaultValue: 35.0, // 기본값 35도
        comment: '알림을 보낼 최고 온도 수치' 
      },
      min_temp: { 
        type: Sequelize.FLOAT, 
        defaultValue: 5.0, // 기본값 5도
        comment: '알림을 보낼 최저 온도 수치' 
      },
      min_light: { 
        type: Sequelize.INTEGER, 
        defaultValue: 100, // 기본값 100
        comment: '알림을 보낼 최소 조도 수치' 
      },
      // -----------------------------------------------------
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
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }
}

module.exports = SpeciesInfo;