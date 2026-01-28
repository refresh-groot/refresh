const repository = require('./repository');
const fs = require('fs');
const path = require('path');

// 1. 진단방 생성
const addDiagnosisLog = async (req, res) => {
    try {
        const { plantId } = req.params;
        const { question, result, recommendation, confidence, title } = req.body;
        const file = req.file;

        // 이미지 파일이 있으면 URL 생성
        const imageUrl = file ? `/uploads/${file.filename}` : null;

        const newLog = await repository.create({
            plant_id: plantId,
            image_url: imageUrl,
            question,
            result,
            recommendation,
            confidence: confidence || 0.0,
            title: title 
        });

        res.status(201).json(newLog);
    } catch (error) {
        console.error('진단방 생성 실패:', error);
        res.status(500).json({ message: '진단방 생성 중 오류가 발생했습니다.' });
    }
};

// 2. 진단 목록 조회
const getDiagnosisLogs = async (req, res) => {
    try {
        const { plantId } = req.params;
        const logs = await repository.findAllByPlantId(plantId);
        res.status(200).json(logs);
    } catch (error) {
        console.error('진단방 목록 조회 실패:', error);
        res.status(500).json({ message: '목록 조회 중 오류가 발생했습니다.' });
    }
};

// 3. 진단방 이름 변경
const updateDiagnosisTitle = async (req, res) => {
    try {
        const { logId } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: '변경할 이름을 입력해주세요.' });
        }

        await repository.updateTitle(logId, title);
        res.status(200).json({ message: '진단방 이름이 변경되었습니다.', title });

    } catch (error) {
        console.error('이름 변경 실패:', error);
        res.status(500).json({ message: '이름 변경 중 오류가 발생했습니다.' });
    }
};

// 4. 진단방 삭제 (파일 삭제 + DB 삭제)
const deleteDiagnosisLog = async (req, res) => {
    try {
        const { logId } = req.params;

        //  삭제 전 파일 경로 확인
        const log = await repository.findById(logId);
        if (!log) {
            return res.status(404).json({ message: '해당 진단방을 찾을 수 없습니다.' });
        }

        //  이미지 파일이 있다면 서버 폴더에서 삭제
        if (log.image_url) {
            const fileName = path.basename(log.image_url);
            // backend/domain/diagnosisLog 기준 -> ../../public/uploads
            const filePath = path.join(__dirname, '../../public/uploads', fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ 파일 삭제 완료: ${filePath}`);
            }
        }

        //  DB에서 기록 삭제
        await repository.deleteById(logId);
        res.status(200).json({ message: '진단방이 삭제되었습니다.' });

    } catch (error) {
        console.error('삭제 실패:', error);
        res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    addDiagnosisLog,
    getDiagnosisLogs,
    updateDiagnosisTitle,
    deleteDiagnosisLog
};