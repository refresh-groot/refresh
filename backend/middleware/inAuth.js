const Joi = require('joi');

module.exports = {
  // 1. [회원가입 전체] 검사 규칙
  validateSignup: (req, res, next) => {
    const schema = Joi.object({
      // loginId: 영문+숫자, 3~30자, 필수
      loginId: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': '아이디를 입력해주세요.',
        'string.min': '아이디는 최소 3자 이상이어야 합니다.',
        'string.alphanum': '아이디는 영문과 숫자만 사용할 수 있습니다.'
      }),

      // password: 최소 8자, 영문+숫자 포함
      password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().messages({
        'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
        'string.pattern.base': '비밀번호는 영문과 숫자를 포함해야 합니다.'
      }),

      // email: 이메일 형식 체크
      email: Joi.string().email().required().messages({
        'string.email': '유효한 이메일 형식이 아닙니다.',
        'string.empty': '이메일을 입력해주세요.'
      }),

      // nickname: 2~20자
      nickname: Joi.string().min(2).max(20).required().messages({
        'string.empty': '닉네임을 입력해주세요.'
      })
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    next();
  },

  // 2. [아이디 중복 확인 버튼용] 검사 규칙
  validateCheckId: (req, res, next) => {
    const schema = Joi.object({
      // 아이디 하나만 콕 집어서 검사 (규칙은 위와 동일)
      loginId: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': '아이디를 입력해주세요.',
        'string.min': '아이디는 최소 3자 이상이어야 합니다.',
        'string.alphanum': '아이디는 영문과 숫자만 사용할 수 있습니다.'
      })
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    next();
  },

  // 3. [닉네임 중복 확인 버튼용] 검사 규칙 (필요할 때 쓰세요)
  validateCheckNickname: (req, res, next) => {
    const schema = Joi.object({
      nickname: Joi.string().min(2).max(20).required().messages({
        'string.empty': '닉네임을 입력해주세요.',
        'string.min': '닉네임은 최소 2자 이상이어야 합니다.'
      })
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    next();
  }
};