const Joi = require('joi');

module.exports = {
  // 회원가입
  Signup: (req, res, next) => {
    const schema = Joi.object({
      loginId: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': '아이디를 입력해주세요.',
        'string.min': '아이디는 최소 3자 이상이어야 합니다.',
        'string.alphanum': '아이디는 영문과 숫자만 사용할 수 있습니다.'
      }),
      password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().messages({
        'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
        'string.pattern.base': '비밀번호는 영문과 숫자를 포함해야 합니다.'
      }),
      email: Joi.string().email().required().messages({
        'string.email': '유효한 이메일 형식이 아닙니다.',
        'string.empty': '이메일을 입력해주세요.'
      }),
      nickname: Joi.string().min(2).max(20).required().messages({
        'string.empty': '닉네임을 입력해주세요.'
      }),
      // 👇 [추가] 프론트엔드에서 넘어오는 AI 동의 여부를 허용 (없어도 통과되도록 optional 처리)
      isAiDataAllowed: Joi.boolean().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
  },

  // 아이디 중복 확인
  CheckId: (req, res, next) => {
    const schema = Joi.object({
      loginId: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': '아이디를 입력해주세요.',
        'string.min': '아이디는 최소 3자 이상이어야 합니다.',
        'string.alphanum': '아이디는 영문과 숫자만 사용할 수 있습니다.'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
  },

  // 닉네임 중복 확인
  CheckNickname: (req, res, next) => {
    const schema = Joi.object({
      nickname: Joi.string().min(2).max(20).required().messages({
        'string.empty': '닉네임을 입력해주세요.',
        'string.min': '닉네임은 최소 2자 이상이어야 합니다.'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
  },

  // 회원 탈퇴
  Withdraw: (req, res, next) => {
    const schema = Joi.object({
      // 👇 [수정] 소셜 로그인 유저(비밀번호 없음)도 탈퇴할 수 있도록 빈 문자열/null 허용 및 optional 처리
      password: Joi.string().allow('', null).optional().messages({
        'string.base': '비밀번호 형식이 올바르지 않습니다.'
      }),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
  },
  
  // 알림 설정
  UpdateAlert: (req, res, next) => {
    const schema = Joi.object({
      isAlertOn: Joi.boolean().required().messages({
        'any.required': '알림 설정 값(true/false)을 보내주세요.',
        'boolean.base': '알림 설정은 true 또는 false여야 합니다.'
      }),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
  }
};