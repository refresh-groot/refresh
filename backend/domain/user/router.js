const express = require('express');
const router = express.Router();
const controller = require('./controller');

// 회원가입
router.post('/signup', controller.signup);

// 로그인
router.post('/login', controller.login);
router.post('/logout', controller.logout);

// 아이디/닉네임 중복 확인
router.post('/check/id', controller.checkloginId);
router.post('/check/nickname', controller.checkNickname);

// 이메일 인증 관련
router.post('/email/send', controller.sendEmail);   // 인증번호 발송 (POST /api/email/send)
router.post('/email/verify', controller.verifyEmail); // 인증번호 확인 (POST /api/email/verify)

module.exports = router;