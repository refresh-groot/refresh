const service = require('./service'); 

// 1. 진단방 생성
const addDiagnosisLog = async (req, res) => {
    try {
        const { plantId } = req.params;
        const { question, title, session_id, sensor_data } = req.body; // 👈 sensor_data 추가!
        const files = req.files;

        const newLog = await service.addDiagnosisLog({
            plantId,
            files,
            question,
            title,
            sessionId: session_id,
            sensorData: sensor_data // 👈 서비스로 전달하도록 추가!
        });

        res.status(200).json(newLog);
    } catch (error) {
        console.error('진단방 생성 실패:', error);
        res.status(500).json({ message: '진단 중 오류가 발생했습니다.' });
    }
};

// 2. 진단방 목록 조회
const getDiagnosisLogs = async (req, res) => {
    try {
        const { plantId } = req.params;
        const logs = await service.getDiagnosisLogs(plantId);
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: '목록 조회 실패' });
    }
};

// 3. 진단방 이름 변경
const updateDiagnosisTitle = async (req, res) => {
    try {
        const { logId } = req.params;
        const { title } = req.body;
        
        if (!title) return res.status(400).json({ message: '이름을 입력해주세요.' });

        await service.updateDiagnosisTitle(logId, title);
        res.status(200).json({ message: '이름 변경 성공', title });
    } catch (error) {
        res.status(500).json({ message: '이름 변경 실패' });
    }
};

// 4. 진단방 삭제
const deleteDiagnosisLog = async (req, res) => {
    try {
        const { logId } = req.params;
        await service.deleteDiagnosisLog(logId);
        res.status(200).json({ message: '삭제 성공' });
    } catch (error) {
        console.error(error);
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ message: '기록을 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '삭제 실패' });
    }
};

// 5. 세션(채팅방) 이름 변경
const updateSessionTitle = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;

        if (!title) return res.status(400).json({ message: '이름을 입력해주세요.' });

        // 서비스의 세션 이름 변경 함수 호출
        await service.updateSessionTitle(sessionId, title);
        res.status(200).json({ message: '채팅방 이름 변경 성공' });
    } catch (error) {
        console.error('세션 이름 변경 실패:', error);
        res.status(500).json({ message: '이름 변경 실패' });
    }
};

// 6. 세션(채팅방) 삭제
const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // 서비스의 세션 삭제 함수 호출
        await service.deleteSession(sessionId);
        res.status(200).json({ message: '채팅방 삭제 성공' });
    } catch (error) {
        console.error('세션 삭제 실패:', error);
        res.status(500).json({ message: '삭제 실패' });
    }
};

module.exports = {
    addDiagnosisLog,
    getDiagnosisLogs,
    updateDiagnosisTitle,
    deleteDiagnosisLog,
    updateSessionTitle,
    deleteSession
};