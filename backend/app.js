const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const db = require('./domain'); // 도메인 모델 및 데이터베이스 설정 로드
const userRouter = require('./domain/user/router'); // 라우터 불러오기

const app = express(); // 익스프레스 애플리케이션 객체 생성

/**
 * 1. 미들웨어 설정
 */
app.use(cors({
  origin: true, // 혹은 프론트엔드 주소 (예: 'http://localhost:3000')
  credentials: true // [중요] 쿠키/세션을 주고받으려면 true여야 함
}));
app.use(morgan('dev')); 
app.use(express.json()); // [중요] JSON 데이터 파싱 (req.body 생성)
app.use(express.urlencoded({ extended: false })); 
app.use(cookieParser(process.env.COOKIE_SECRET || 'smartplant-secret'));

/**
 * 2. 세션 설정
 */
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET || 'smartplant-secret',
  cookie: { 
    httpOnly: true, // 자바스크립트로 쿠키 탈취 방지
    secure: false,  // HTTP 환경이므로 false 유지
    maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효 기간 (1일)
  } 
}));

app.use(flash());

/**
 * 3. DB 연결 및 동기화
 */
// alter: false로 변경하여 이미 존재하는 제약 조건과 충돌하지 않게 합니다.
db.sequelize.sync({ force: false, alter: false })
  .then(() => {
    console.log('smartplant DB 연결 및 동기화 성공!');
  })
  .catch((err) => {
    // 에러가 떠도 무시하고 진행할 수 있도록 로그만 찍습니다.
    console.error('DB 동기화 알림 (무시 가능):', err.message);
  });

/**
 * 4. 라우터 설정 (미들웨어 밑에 있어야 함!)
 */
app.use('/', userRouter); // 이제 req.body를 정상적으로 받을 수 있음

/**
 * 기본 라우트
 */
app.get('/', (req, res) => {
  res.send('SmartPlant 서버 정상 가동 중');
});

/**
 * 서버 실행
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`서버가 ${port}번 포트에서 정상 작동 중입니다!`);
});

module.exports = app;