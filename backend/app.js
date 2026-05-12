const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const db = require('./domain'); // 도메인 모델 및 데이터베이스 설정 로드
const userRouter = require('./domain/user/router'); // 라우터 불러오기
const plantRouter = require('./domain/plant/router');
const wateringRouter = require('./domain/wateringLog/router');
const diagnosisLogRouter = require('./domain/diagnosisLog/router');
const environmentLogRouter = require('./domain/EnvironmentLog/router');
const notificationRouter = require('./domain/notification/router');
const communityRouter = require('./domain/community/router'); 

// --- [Gemini AI 설정 시작] ---
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 보안을 위해 .env 파일에서 키를 읽어옴
const GEN_AI_KEY = process.env.GEMINI_API_KEY; 

if (!GEN_AI_KEY) {
  console.error("경고: .env 파일에 GEMINI_API_KEY가 설정되지 않았습니다.");
}

const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

const plantModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", // 모델명은 기존 그대로 유지
  systemInstruction: {
    role: "system",
    parts: [{ text: `
역할: IoT 스마트팜 제어 데이터 생성기
출력: 오직 JSON 데이터만 출력 (마크다운 금지)
스키마:
{
  "plant_name": "식물 이름",
  "min_moisture": 0~100 (정수),
  "water_duration_ms": 펌프 작동 시간(ms),
  "care_tip": "짧은 팁"
}
데이터 기준:
- 건조 식물: min=10~20, duration=1000
- 보통 식물: min=30~50, duration=2000~3000
- 습윤 식물: min=60~70, duration=3000~5000
    `}]
  },
  generationConfig: { responseMimeType: "application/json" }
});
// --- [Gemini AI 설정 끝] ---

const app = express(); // 익스프레스 애플리케이션 객체 생성

app.set('trust proxy', 1); // 추가: 프록시 환경에서 세션 쿠키가 잘 전달되도록 설정

const allowedOrigins = [
  'http://localhost:5173',
  'http://223.130.157.123:8080'
];

/**
 * 1. 미들웨어 설정
 */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 차단'));
    }
  },
  credentials: true
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
  resave: true,               // [수정] false -> true
  saveUninitialized: true,    // [수정] false -> true
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
db.sequelize.sync({ force: false, alter: false })//테이블 생성이 필요할 때 잠시 true로 변경
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
app.use('/api/watering-log', wateringRouter);
app.use('/api/environment-log', environmentLogRouter);
app.use('/', userRouter); // 이제 req.body를 정상적으로 받을 수 있음
app.use('/api/diagnosis-logs', diagnosisLogRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/community', communityRouter); 

/**
 * 스마트팜 식물 AI API 추가
 */
app.get('/plant/:plantName', async (req, res) => {
  const plantName = req.params.plantName;
  console.log(`[AI 요청] 식물: ${plantName}`);

  try {
    const result = await plantModel.generateContent(plantName);
    const response = await result.response;
    const text = response.text();
    
    console.log(`[AI 응답] ${text}`);
    // AI가 준 JSON 문자열을 실제 객체로 변환하여 전송
    res.json(JSON.parse(text));
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "AI Processing Failed" });
  }
});

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