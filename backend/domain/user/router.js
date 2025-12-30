const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateSignup, validateCheckId, validateCheckNickname } = require('../../middleware/inAuth');

// 회원가입
router.post('/signup', validateSignup, controller.signup);
router.post('/check/id', validateCheckId, controller.checkloginId); 
router.post('/check/nickname', validateCheckNickname, controller.checkNickname);

// 이메일 인증 관련
router.post('/email/send', controller.sendEmail);   // 인증번호 발송 (POST /api/email/send) 
router.post('/email/verify', controller.verifyEmail); // 인증번호 확인 (POST /api/email/verify) 

// 로그인
router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;