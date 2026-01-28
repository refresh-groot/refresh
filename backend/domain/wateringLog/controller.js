// backend/domain/wateringLog/controller.js
const service = require('./service');

module.exports = {
    // [POST] 급수 기록 저장
    createWateringLog: async (req, res) => {
        try {
            console.log("급수 기록 요청 도착:", req.body);
            const log = await service.recordWatering(req.body);
            return res.status(201).json({
                message: '급수 이력이 성공적으로 저장되었습니다.',
                data: log
            });
        } catch (error) {
            console.error("급수 기록 저장 에러:", error);
            return res.status(500).json({ message: error.message });
        }
    },

    // [GET] 특정 식물의 급수 이력 목록 조회
    getWateringHistory: async (req, res) => {
        try {
            const { plantId } = req.params;
            const logs = await service.getLogs(plantId);
            return res.status(200).json(logs);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    // 식물 사진 추가 함수
uploadLogImage: async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });

        // 저장된 파일의 접근 경로 생성 
        const imageUrl = `/uploads/${req.file.filename}`;
        const updatedLog = await service.updateImage(id, imageUrl);

        return res.status(200).json({
            message: '사진이 성공적으로 등록되었습니다.',
            data: updatedLog
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
};