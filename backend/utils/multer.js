const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. 저장할 폴더 위치 설정 (backend/public/uploads)
// __dirname은 현재 파일(multer.js)의 위치입니다.
// '../public/uploads'로 설정하여 backend 폴더 바로 아래의 public/uploads를 가리킵니다.
const uploadDir = path.join(__dirname, '../public/uploads/');

// 2. [핵심] 폴더가 없으면 알아서 만들기 (자동 생성)
// 이 코드가 있어야 "ENOENT: no such file or directory" 에러가 안 뜹니다!
if (!fs.existsSync(uploadDir)) {
    console.log('📂 uploads 폴더가 없어서 자동으로 생성합니다!');
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. 저장 설정 (파일명, 저장경로)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 위에서 만든(또는 확인한) 폴더 경로를 사용
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // 파일명 깨짐 방지 (UTF-8) & 중복 방지 (날짜 + 랜덤숫자)
    const ext = path.extname(file.originalname);
    // 한글 파일명도 안전하게 처리
    const uniqueName = path.basename(file.originalname, ext) + '_' + Date.now() + ext;
    
    cb(null, uniqueName);
  },
});

// 4. 업로드 제한 설정 (용량 5MB)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;