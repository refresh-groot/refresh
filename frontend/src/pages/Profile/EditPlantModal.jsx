import { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import './EditPlantModal.css';

function EditPlantModal({ plant, onClose, onSaved }) {
const [reason, setReason] = useState('');

const handleSubmit = async () => {
    if (!reason) {
    return Swal.fire('선택 필요', '사망 이유를 선택해주세요.', 'warning');
    }

    try {
    await api.patch(`/api/plants/${plant.id}/archive`, {
        death_reason: reason
    });
    Swal.fire('수정 완료', '식물 정보가 수정되었습니다.', 'success');
    onSaved();
    onClose();
    } catch {
    Swal.fire('수정 실패', '식물 정보 수정에 실패하였습니다', 'error');
    }
};

return (
    <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>🪦 식물 사망 처리</h3>
        <p className="plant-name-display">
        <strong>{plant.plant_name}</strong> ({plant.species})
        </p>

        <div className="reason-select-wrapper">
        <label>사망 이유를 선택해주세요</label>
        <select 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="reason-select"
        >
            <option value="">-- 선택해주세요 --</option>
            <option value="물 부족">💧 물 부족</option>
            <option value="과습">💦 과습</option>
            <option value="빛 부족">☀️ 빛 부족</option>
            <option value="병충해">🐛 병충해</option>
            <option value="기타">📝 기타</option>
        </select>
        </div>

        <div className="modal-actions">
        <button className="save-btn" onClick={handleSubmit}>저장</button>
        <button className="cancel-btn" onClick={onClose}>취소</button>
        
        </div>
    </div>
    </div>
);
}

export default EditPlantModal;
