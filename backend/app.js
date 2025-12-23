const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const db = require('./domain'); // 도메인 모델 및 데이터베이스 설정 로드

const app = express(); // 익스프레스 애플리케이션 객체 생성

/**
 * 미들웨어 설정
 * 요청 처리 단계별 로직 정의
 */
app.use(morgan('dev')); // 개발 모드 로그 기록 및 접속 정보 콘솔 출력
app.use(express.json()); // JSON 데이터 파싱
app.use(express.urlencoded({ extended: false })); // URL-encoded 데이터 파싱 (폼 데이터 처리)
app.use(cookieParser(process.env.COOKIE_SECRET || 'smartplant-secret')); // 쿠키 해석 및 관리

/**
 * 세션 관리 설정
 * 사용자별 세션 정보 관리 및 로그인 상태 유지
 */
app.use(session({
  resave: false, // 세션 수정 사항 없을 시 재저장 여부
  saveUninitialized: false, // 내용 없는 세션 저장 여부
  secret: process.env.COOKIE_SECRET || 'smartplant-secret', // 세션 암호화 비밀키
  cookie: { 
    httpOnly: true, // 보안을 위한 자바스크립트 쿠키 접근 제한
    secure: false   // HTTP 환경 전송 허용
  } 
}));

app.use(flash()); // 일회성 알림 메시지 처리 미들웨어

/**
 * 데이터베이스 동기화
 * Sequelize 모델과 실제 데이터베이스 테이블 일치화
 */
db.sequelize.sync({ force: true }) // force: true 설정 시 기존 테이블 삭제 후 재생성
  .then(() => {
    console.log('smartplant DB 연결 및 테이블 생성 성공');
  })
  .catch((err) => {
    console.error('DB 연결 에러:', err);
  });



/**
 * 기본 라우트 설정
 */
app.get('/', (req, res) => {
  res.send('SmartPlant 서버 정상 가동 중'); // 서버 가동 확인용 초기 화면
});

/**
 * app 객체 외부 노출
 * bin/www 실행 파일에서 설정을 가져가기 위한 모듈 배출
 */
module.exports = app;