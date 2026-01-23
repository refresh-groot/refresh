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
        // 1. 어떤 식물에 물을 줬는지 식별 (Plant 모델의 ID 참조)
        plant_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: '대상 식물 고유 ID',
        },
        // 2. 펌프 작동 시간 (데이터 분석 시 급수량 추정 지표)
        duration_sec: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '펌프 작동 시간(초)',
        },
        // 3. 급수 방식 구분 (자동/수동)
        is_auto: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'true: 자동 급수, false: 수동 급수',
        },
        // 4. 물 줄 당시의 토양 습도 (식물 상태 분석 핵심 데이터)
        moisture_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: '급수 직전 토양 수분값',
        },
        // 6. 기록 시간 (ERD의 logged_at 역할)
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
        updatedAt: false, // 이력 데이터이므로 수정 일자는 관리하지 않음
        underscored: true, // DB 컬럼명을 snake_case로 자동 변환 (watering_date 등)
        modelName: 'WateringLog',
        tableName: 'watering_logs',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    // 식물 정보와 N:1 관계 설정 (어떤 식물의 기록인지 연결)
    db.WateringLog.belongsTo(db.Plant, { 
        foreignKey: 'plant_id', 
        targetKey: 'id',
        onDelete: 'CASCADE' // 식물 삭제 시 해당 급수 기록도 함께 삭제
    });
  }
}

module.exports = WateringLog;