const { Plant, WateringLog, DiagnosisLog, Notification } = require('../domain');

const requireLogin = (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  return next();
};

const sendForbidden = (res) => res.status(403).json({ message: '이 식물에 접근할 권한이 없습니다.' });

const requirePlantOwner = (paramName = 'plantId') => async (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const plant = await Plant.findByPk(req.params[paramName]);
    if (!plant) {
      return res.status(404).json({ message: '해당 식물을 찾을 수 없습니다.' });
    }

    if (String(plant.user_id) !== String(req.session.user.id)) {
      return sendForbidden(res);
    }

    req.plant = plant;
    return next();
  } catch (error) {
    console.error('식물 권한 확인 실패:', error);
    return res.status(500).json({ message: '식물 권한을 확인하지 못했습니다.' });
  }
};

const requireRecordOwner = (Model, paramName = 'id') => async (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const record = await Model.findByPk(req.params[paramName]);
    if (!record) {
      return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
    }

    const plant = await Plant.findByPk(record.plant_id);
    if (!plant || String(plant.user_id) !== String(req.session.user.id)) {
      return sendForbidden(res);
    }

    req.record = record;
    req.plant = plant;
    return next();
  } catch (error) {
    console.error('기록 권한 확인 실패:', error);
    return res.status(500).json({ message: '기록 권한을 확인하지 못했습니다.' });
  }
};

const requireDiagnosisSessionOwner = async (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const sessionId = req.params.sessionId;
    const sessionKey = sessionId === 'no_session' || sessionId === 'null' ? null : sessionId;
    const record = await DiagnosisLog.findOne({ where: { session_id: sessionKey } });
    if (!record) {
      return res.status(404).json({ message: '해당 진단 기록을 찾을 수 없습니다.' });
    }

    const plant = await Plant.findByPk(record.plant_id);
    if (!plant || String(plant.user_id) !== String(req.session.user.id)) {
      return sendForbidden(res);
    }

    req.record = record;
    req.plant = plant;
    return next();
  } catch (error) {
    console.error('진단 세션 권한 확인 실패:', error);
    return res.status(500).json({ message: '진단 세션 권한을 확인하지 못했습니다.' });
  }
};

module.exports = {
  requireLogin,
  requirePlantOwner,
  requireRecordOwner,
  requireDiagnosisSessionOwner,
  WateringLog,
  DiagnosisLog,
  Notification,
};
