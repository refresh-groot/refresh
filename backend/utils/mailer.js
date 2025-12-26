const nodemailer = require('nodemailer');

// 전송 객체 설정 (한 번만 만들어두면 계속 씀)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // .env 파일에 설정
    pass: process.env.EMAIL_PASS, // 구글 앱 비밀번호
  },
});

module.exports = {
  // 메일 보내는 함수
  sendVerificationCode: async (email, code) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[SmartPlant] 이메일 인증 번호입니다.',
      text: `인증 번호는 [${code}] 입니다. 3분 안에 입력해주세요.`,
    };
    await transporter.sendMail(mailOptions);
  },
};