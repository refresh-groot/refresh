const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const db = require('./domain'); // 도메인 모델 및 데이터베이스 설정 로드
const userRouter = require('./domain/user/router'); // 라우터 불러오기
const plantRouter = require('./domain/plant/router');

const app = express(); // 익스프레스 애플리케이션 객체 생성

/**
 * 1. 미들웨어 설정
 */
app.use(cors({
  origin: 'http://localhost:5173',  // 프론트엔드 주소를 명확히 지정
  credentials: true // [중요] 쿠키/세션을 주고받으려면 true여야 함
}));
app.use(morgan('dev')); 
app.use(express.json()); // [중요] JSON 데이터 파싱 (req.body 생성)
app.use(express.urlencoded({ extended: true })); 
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
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
    sameSite: 'lax',      // 크로스 도메인에서 일부 작동
    maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효 기간 (1일)
  },
  name: 'connect.sid'     // 세션 쿠키 이름 명시 
}));

app.use(flash());

/**
 * 3. DB 연결 및 동기화
 * [변경 사항]: 네이버 클라우드 MySQL에 테이블이 없는 상태이므로 alter: true로 설정합니다.
 * alter: true는 모델(Device.js 등) 정의와 실제 DB를 비교해서 테이블을 자동으로 생성해줍니다.
 */
db.sequelize.sync({ force: false, alter: false })
  .then(() => {
    // 성공 시 출력될 메시지
    console.log('네이버 클라우드 smartplant DB 연결 및 테이블 동기화 성공!');
  })
  .catch((err) => {
    // 에러 발생 시 로그를 찍어 원인을 파악합니다.
    console.error('❌ DB 동기화 에러 (설정 확인 필요):', err.message);
  });

/**
 * 4. 라우터 설정 (미들웨어 밑에 있어야 함!)
 */
app.use('/api/plants', plantRouter); //식물 API를 활성화
app.use('/api/user', userRouter);
app.use('/', userRouter); // 이제 req.body를 정상적으로 받을 수 있음


/**
 * 기본 라우트
 */
app.get('/', (req, res) => {
  res.send('SmartPlant 서버 정상 가동 중');
});

/**
 * [주의] 서버 실행 설정
 * bin/www 파일에서 이미 서버를 실행(listen)하고 있으므로, 
 * app.js 내부의 중복된 listen 코드는 주석 처리하여 포트 충돌을 방지합니다.
 */
// const port = process.env.PORT || 8080;
// app.listen(port, '0.0.0.0', () => {
//   console.log(`서버가 ${port}번 포트에서 정상 작동 중입니다!`);
// });

module.exports = app;