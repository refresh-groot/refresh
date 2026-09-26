const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validator = require('../../middleware/validator');
const { requireLogin } = require('../../middleware/plantAuthorization');

// 회원가입
router.post('/signup', validator.Signup, controller.signup);
router.post('/check/id', validator.CheckId, controller.checkLoginId);
router.post('/check/nickname', validator.CheckNickname, controller.checkNickname);
router.post('/email/send', controller.sendEmail);   
router.post('/email/verify', controller.verifyEmail); 

// 로그인/로그아웃
router.post('/login', controller.login);
router.post('/logout', controller.logout);

// 프로필 조회 및 수정
router.get('/profile', requireLogin, controller.getProfile);
router.put('/profile', requireLogin, controller.updateProfile);
router.patch('/alert', requireLogin, validator.UpdateAlert, controller.updateAlert);

// 회원 탈퇴
router.delete('/withdraw', requireLogin, validator.Withdraw, controller.withdraw);

// 세션 체크 및 소셜 로그인 콜백
router.get('/check', controller.check);

module.exports = router;
