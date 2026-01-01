// backend/domain/plant/controller.js
const service = require('./service');
const repository = require('./repository');

module.exports = {
  addPlant: async (req, res) => {
    try {
      console.log('--- 데이터 수신 확인 ---');
      console.log('Body:', req.body);
      console.log('File:', req.file);

      // [수정] 로그인이 안 되어 있으면 여기서 먼저 중단
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }

      // [수정] 데이터가 아예 안 들어왔을 때를 위한 초기화
      const data = req.body || {};
      const { plant_name, species, reg_date } = data;

      // [수정] 필수 값 체크
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

  // 나의 식물 리스트 조회 (GET /api/plant) - 가이드, 레벨, 랜덤 팁 통합 버전
  getPlants: async (req, res) => {
    try {
      const userId = req.session.user.id; // 로그인한 유저 확인 [cite: 526]
      
      // 1. 내 식물 정보 (가이드 정보가 포함된 JOIN 데이터) 가져오기
      const plants = await service.getUserActivePlants(userId);
      
      // 2. 내 활동 로그(자동급수 날짜) 기반으로 사용자 레벨 계산
      const level = await service.calculateUserLevel(userId);
      
      // 3. 지식 베이스(SpeciesInfo)에서 랜덤하게 한 줄 미세팁 가져오기
      const tip = await repository.getRandomTip();

      return res.status(200).json({
        user_nickname: req.session.user.nickname,
        user_level: level, // 계산된 레벨(초보, 중수, 고수, 타잔) 전송
        random_tip: tip ? tip.mini_tip : "식물과 함께 상쾌한 하루 되세요!", // 랜덤 팁 전송
        plants: plants // 식물 리스트와 각 식물별 가이드 정보 전송
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};