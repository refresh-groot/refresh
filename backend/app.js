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
 * 1. 미들웨어 설정 (가장 먼저 실행되어야 함!)
 * 그래야 들어오는 데이터를 JSON으로 해석할 수 있음
 */
app.use(cors());
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
    httpOnly: true,
    secure: false
  } 
}));

app.use(flash());

/**
 * 3. DB 연결 및 동기화
 * authenticate() -> sync() 로 변경해야 테이블이 생성됩니다.
 */
// alter: true -> 데이터 유지하면서 컬럼 변경사항 반영
// force: false -> 기존 데이터 삭제 안 함
db.sequelize.sync({ force: true })
  .then(() => {
    console.log('smartplant DB 연결 및 동기화 성공!');
  })
  .catch((err) => {
    console.error('DB 연결 에러:', err);
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