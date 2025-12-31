// backend/global/config.js

require('dotenv').config();
const env = process.env;

// MySQL 설정 객체
const mysqlConfig = {
  // [변경] 오라클 대신 mysql 사용
  dialect: "mysql",
  
  // NCP 공인 IP 주소 (.env의 DB_HOST)
  host: env.DB_HOST || "223.130.157.123", 
  
  // MySQL 기본 포트 3306
  port: env.DB_PORT || 3306,

  // DB 사용자 아이디 (smartplant_user)
  username: env.DB_USER || "smartplant_user", 
  
  // DB 비밀번호
  password: env.DB_PASSWORD,

  // 실제 데이터베이스 이름 (smartplant)
  database: env.DB_NAME || "smartplant", 
  
  // 한국 시간 설정
  timezone: "+09:00",
  
  dialectOptions: {
    // MySQL 접속 시 날짜 데이터를 문자열로 가져오지 않도록 설정 (선택 사항)
    dateStrings: true,
    typeCast: true
  },

  // 커넥션 풀 설정 (성능 유지용)
  pool: {
    max: 5,         // 최대 연결 수
    min: 0,         // 최소 연결 수
    acquire: 30000, // 연결 시도 최대 대기 시간 (30초)
    idle: 10000     // 연결이 놀고 있을 때 끊는 시간 (10초)
  },

  // 개발 모드에서는 SQL 로그를 찍음
  logging: console.log, 
};

// 환경별 설정 내보내기
const development = { ...mysqlConfig };
const production = { ...mysqlConfig, logging: false };
const test = { ...mysqlConfig, logging: false };

module.exports = { development, production, test };