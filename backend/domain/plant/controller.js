const service = require('./service');

module.exports = {
  // 1. 식물 추가 (사진 업로드 로직 포함)
  addPlant: async (req, res) => {
    try {
      const userId = req.session.user.id; // 세션에서 유저 ID 가져오기 [cite: 526]
      const { plant_name, species, reg_date } = req.body;
      
      // 파일이 업로드되었다면 해당 경로 사용, 없으면 기본 이미지 사용
      const photo_url = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.png';

      const newPlant = await service.addPlant({
        user_id: userId,
        plant_name,
        species,
        reg_date,
        photo_url // DB의 photo_url 컬럼에 경로 저장 
      });
      
      return res.status(201).json({ message: '식물이 성공적으로 등록되었습니다!', plant: newPlant });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // 식물 삭제 처리 (DELETE /api/plant/:id)
  removePlant: async (req, res) => {
    try {
      const { id } = req.params; // URL에서 식물 ID 추출
      const { mode } = req.query; // ?mode=archive 또는 ?mode=permanent
      
      await service.handleDeletion(id, mode);
      
      return res.status(200).json({ message: '처리가 완료되었습니다.' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  // 나의 식물 리스트 조회 (GET /api/plant)
  getPlants: async (req, res) => {
    try {
      const userId = req.session.user.id; // 로그인한 유저 확인 [cite: 526]
      
      // DB에서 해당 유저의 식물 중 '활성(active)' 상태인 것만 가져옴
      const plants = await service.getUserActivePlants(userId);
      
      return res.status(200).json({
        user_nickname: req.session.user.nickname,
        plants: plants
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};