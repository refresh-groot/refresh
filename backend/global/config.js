// backend/global/config.js

require('dotenv').config();
const path = require('path');
const env = process.env;

// [중요] 1. 지갑(Wallet) 폴더의 절대 경로를 찾습니다.
// __dirname은 현재 파일(config.js)의 위치인 'backend/global'을 의미합니다.
// '..'으로 상위 폴더(backend)로 간 뒤, 'wallet' 폴더를 가리킵니다.
const walletPath = path.join(__dirname, '..', 'wallet');

// [중요] 2. 오라클 드라이버에게 지갑 위치를 알려줍니다 (TNS_ADMIN 환경변수 설정)
// 이 설정이 있어야 오라클이 지갑 파일을 찾아서 로그인할 수 있습니다.
process.env.TNS_ADMIN = walletPath;

const oracleConfig = {
  // [변경] 데이터베이스 종류를 oracle로 변경
  dialect: "oracle",
  
  // 오라클 클라우드 아이디 (보통 ADMIN)
  username: env.DB_USER || "ADMIN", 
  
  // 오라클 클라우드 비밀번호 (특수문자 포함 등 규칙 까다로움)
  password: env.DB_PASSWORD,

  // [중요] MySQL의 host, database 대신 'connectString'을 사용합니다.
  // 이 값은 .env 파일의 DB_CONNECT_STRING (예: mydb_medium)을 가져옵니다.
  // 실제 주소 정보는 wallet/tnsnames.ora 파일 안에 들어 있습니다.
  database: env.DB_CONNECT_STRING, 
  
  // 오라클 타임존 설정 (한국 시간)
  timezone: "+09:00",
  
  dialectOptions: {
    // 오라클 접속 시 추가 옵션
    connectString: env.DB_CONNECT_STRING, 
    options: {
      autoCommit: true, // 쿼리 실행 시 자동 저장 (선택 사항)
    }
  },

  // 커넥션 풀 설정 (서버 성능 유지용)
  pool: {
    max: 5,     // 최대 연결 수
    min: 0,     // 최소 연결 수
    acquire: 60000, // 연결 시도 최대 대기 시간 (60초) - 오라클은 연결이 좀 느릴 수 있음
    idle: 10000 // 연결이 놀고 있을 때 끊는 시간 (10초)
  },

  // 개발 모드에서는 콘솔에 SQL 로그를 찍음
  logging: console.log, 
};

// 개발, 배포, 테스트 환경별 설정 내보내기
const development = { ...oracleConfig };
const production = { ...oracleConfig, logging: false }; // 배포 시엔 로그 끔
const test = { ...oracleConfig, logging: false };

module.exports = { development, production, test };