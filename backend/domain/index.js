const Sequelize = require('sequelize');
// 1. 환경 설정 가져오기
const config = require('../global/config');
const db = {};

// 2. DB 연결 설정 (development 환경)
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 3. Sequelize 인스턴스 생성 (DB 접속)
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,   // 기존 설정 유지
    logging: false // SQL 실행 로그 비활성화
  }
);

// ==========================================================
//  4. 모델 파일 불러오기 
// 구조: ./폴더명/파일명.js
// ==========================================================

const User = require('./user/User');
const Plant = require('./plant/Plant');
const SpeciesInfo = require('./plant/SpeciesInfo'); // 1. 추가
const Device = require('./device/Device');
const DiagnosisLog = require('./diagnosisLog/DiagnosisLog');
const WateringLog = require('./wateringLog/WateringLog');
const EnvironmentLog = require('./EnvironmentLog/EnvironmentLog'); // [추가]
const Notification = require('./notification/Notification'); // [추가]
// 5. db 객체에 담기
db.User = User;
db.Plant = Plant;
db.SpeciesInfo = SpeciesInfo; // 2. 추가
db.Device = Device;
db.DiagnosisLog = DiagnosisLog;
db.WateringLog = WateringLog;
db.EnvironmentLog = EnvironmentLog; // [추가]
db.Notification = Notification; // [추가]

// 6. 모델 초기화 (init)
User.init(sequelize);
Plant.init(sequelize);
SpeciesInfo.init(sequelize); // 3. 추가
Device.init(sequelize);
DiagnosisLog.init(sequelize);
WateringLog.init(sequelize);
EnvironmentLog.init(sequelize); // [추가]
Notification.init(sequelize); // [추가]
// 7. 관계 설정 (associate)
User.associate(db);
Plant.associate(db);
// SpeciesInfo는 정적 데이터라 현재 관계 설정이 없으면 생략 가능하지만
// 형식을 맞추기 위해 추가(SpeciesInfo.js에 static associate가 있어야 함)
if (SpeciesInfo.associate) SpeciesInfo.associate(db); // 4. 추가
Device.associate(db);
DiagnosisLog.associate(db);
WateringLog.associate(db);
EnvironmentLog.associate(db); // [추가]
Notification.associate(db); // [추가]

// 8. 내보내기
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;