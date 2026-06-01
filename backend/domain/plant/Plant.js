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
          /* [수정] 특정 종만 허용하던 제약 조건을 주석 처리
              이제 species_info 테이블에 없는 식물 이름도 자유롭게 입력 가능함
          */
          /*
          references: {
            model: 'species_info', // 참조할 테이블 이름 
            key: 'species_name',   // 참조할 테이블의 컬럼 이름 
          },
          onUpdate: 'CASCADE', 
          onDelete: 'CASCADE', 
          */
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
        device_name: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: '매핑된 블루투스 기기 이름',
        },
        // [추가] 사망 이유 저장 컬럼
        death_reason: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: '식물 사망 이유 (물 부족, 과습, 빛 부족, 병충해, 기타)',
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
  // 1. 유저와의 관계: onDelete: 'CASCADE'를 추가해서 연쇄 삭제를 활성화
  db.Plant.belongsTo(db.User, { 
    foreignKey: 'user_id', 
    targetKey: 'id',
    onDelete: 'CASCADE' //CASCADE 추가
  });
  
  // 2. 식물 종 정보 연결
  db.Plant.belongsTo(db.SpeciesInfo, { 
    foreignKey: 'species', 
    targetKey: 'species_name', 
    as: 'guide', 
    constraints: false
  });

  // 3. 자식 로그들과의 관계 (여기도 CASCADE를 넣는 것이 안전)
  // [주석 처리] 하드웨어 관련 파일 삭제로 인해 Device 모델 참조 중단
  // db.Plant.hasOne(db.Device, { foreignKey: 'plant_id', sourceKey: 'id', onDelete: 'CASCADE' });
  
  db.Plant.hasMany(db.DiagnosisLog, { foreignKey: 'plant_id', sourceKey: 'id', onDelete: 'CASCADE' });
  db.Plant.hasMany(db.WateringLog, { foreignKey: 'plant_id', sourceKey: 'id', onDelete: 'CASCADE' });
  db.Plant.hasMany(db.EnvironmentLog, { foreignKey: 'plant_id', sourceKey: 'id', onDelete: 'CASCADE' });
}
}

module.exports = Plant;