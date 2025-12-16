// backend/global/config.js

// 1. .env 파일(금고)을 엽니다.
require('dotenv').config();
const env = process.env;

const development = {
  username: env.DB_USER || "root",
  password: env.DB_PASSWORD || "root", // .env에서 가져오고, 없으면 root
  database: env.DB_NAME || "smart_pot",
  host: env.DB_HOST || "localhost",
  dialect: "mysql",
  port: env.DB_PORT || 3306,
  // (선택) 커넥션 풀 설정: 접속자가 많을 때를 대비한 설정
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log, // 개발 중에는 SQL 로그를 봅니다.
  timezone: "+09:00", // 한국 시간
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    timezone: "+09:00",
  },
};

const production = {
  ...development,
  logging: false, // 배포 때는 로그 끄기
};

const test = {
  ...development,
  logging: false,
};

// 꼭 이렇게 development, production, test로 감싸서 내보내야 합니다!
module.exports = { development, production, test };