// backend/domain/plant/controller.js
const service = require('./service');
const repository = require('./repository');

module.exports = {
  addPlant: async (req, res) => {
  try {
    // [중요] any()로 받을 때는 req.files(배열)를 확인해야 합니다.
    const file = req.files && req.files.length > 0 ? req.files[0] : null;
    
    const { plant_name, species, reg_date } = req.body || {};

    if (!plant_name) {
      return res.status(400).json({ message: '식물 이름을 입력해주세요.' });
    }

    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const userId = req.session.user.id;
    
    // 파일이 있으면 저장된 파일명을 사용하고, 없으면 기본 이미지를 사용합니다.
    const photo_url = file ? `/uploads/${file.filename}` : '/uploads/default.png';

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
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }
      const userId = req.session.user.id;
      const plants = await service.getUserActivePlants(userId);
      const tip = await repository.getRandomTip();

      return res.status(200).json({
        user_nickname: req.session.user.nickname,
        random_tip: tip ? tip.mini_tip : "식물과 함께 상쾌한 하루 되세요!",
        plants: plants
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};