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
  dbConfig
);

// ==========================================================
//  4. 모델 파일 불러오기 
// 구조: ./폴더명/entity/파일명.js
// ==========================================================

const User = require('./user/User');
const Plant = require('./plant/Plant');
const Device = require('./device/entity/Device');
const DiagnosisLog = require('./diagnosisLog/DiagnosisLog');
const WateringLog = require('./wateringLog/WateringLog');

// 5. db 객체에 담기
db.User = User;
db.Plant = Plant;
db.Device = Device;
db.DiagnosisLog = DiagnosisLog;
db.WateringLog = WateringLog;

// 6. 모델 초기화 (init)
User.init(sequelize);
Plant.init(sequelize);
Device.init(sequelize);
DiagnosisLog.init(sequelize);
WateringLog.init(sequelize);

// 7. 관계 설정 (associate)
User.associate(db);
Plant.associate(db);
Device.associate(db);
DiagnosisLog.associate(db);
WateringLog.associate(db);

// 8. 내보내기
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;