const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 저장 경로 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 위에서 만든 폴더 경로 지정
    cb(null, path.join(__dirname, '../public/uploads/')); 
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지를 위해 "유저ID_시간.확장자"로 저장
    const ext = path.extname(file.originalname);
    const userId = req.session.user ? req.session.user.id : 'guest';
    cb(null, `plant_${userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한 (데이터 효율성)
});

module.exports = upload;