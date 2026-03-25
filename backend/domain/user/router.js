const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validator = require('../../middleware/validator');

//  회원가입
router.post('/signup', validator.Signup, controller.signup);
router.post('/check/id', validator.CheckId, controller.checkloginId);
router.post('/check/nickname', validator.CheckNickname, controller.checkNickname);
router.post('/email/send', controller.sendEmail);   
router.post('/email/verify', controller.verifyEmail); 

//  로그인/로그아웃
router.post('/login', controller.login);
router.post('/logout', controller.logout);

//  프로필 조회 및 수정
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.patch('/alert', validator.UpdateAlert, controller.updateAlert);

// 3. 회원 탈퇴
router.delete('/withdraw', validator.Withdraw, controller.withdraw);

router.get('/check', controller.check);
router.get('/auth/kakao/callback', controller.kakaoLogin);

module.exports = router;