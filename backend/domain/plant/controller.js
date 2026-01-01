// backend/domain/plant/controller.js
const service = require('./service');
const repository = require('./repository');

module.exports = {
  addPlant: async (req, res) => {
    try {
      console.log('--- 데이터 수신 확인 ---');
      console.log('Body:', req.body);
      console.log('File:', req.file);
      console.log('Headers:', req.headers['content-type']); // 헤더에 boundary가 포함되어 있는지 확인용

      // 1. 세션 확인
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }

      // 2. 데이터 추출 (중복 선언 오류 수정)
      const { plant_name, species, reg_date } = req.body || {};

      // 3. 필수 데이터 체크
      if (!plant_name) {
        return res.status(400).json({ message: '식물 이름을 입력해주세요.' });
      }

      const userId = req.session.user.id;
      const photo_url = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.png';

      const newPlant = await service.addPlant({
        user_id: userId,
        plant_name,
        species,
        reg_date,
        photo_url 
      });
      
      return res.status(201).json({ message: '식물이 성공적으로 등록되었습니다!', plant: newPlant });
    } catch (error) {
      console.error('식물 등록 에러:', error);
      return res.status(500).json({ message: error.message });
    }
  },
  
  removePlant: async (req, res) => {
    try {
      const { id } = req.params;
      const { mode } = req.query;
      await service.handleDeletion(id, mode);
      return res.status(200).json({ message: '처리가 완료되었습니다.' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getPlants: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const plants = await service.getUserActivePlants(userId);
      const level = await service.calculateUserLevel(userId);
      const tip = await repository.getRandomTip();

      return res.status(200).json({
        user_nickname: req.session.user.nickname,
        user_level: level,
        random_tip: tip ? tip.mini_tip : "식물과 함께 상쾌한 하루 되세요!",
        plants: plants
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};