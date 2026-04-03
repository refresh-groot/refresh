import { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import './EditPlantModal.css';

// 식물 사망(보관) 처리를 위한 모달 컴포넌트
// 사용자가 사망 이유를 선택하면 해당 식물의 상태를 'archived'로 변경하여 목록에서 제외(또는 별도 표시)함
function EditPlantModal({ plant, onClose, onSaved }) {
  // 사용자가 선택한 사망 이유 상태 관리
  const [reason, setReason] = useState('');

  // '저장' 버튼 클릭 시 실행되는 핸들러
  const handleSubmit = async () => {
    // 유효성 검사: 이유를 선택하지 않았을 경우 경고창 표시 후 중단
    if (!reason) {
      return Swal.fire('선택 필요', '사망 이유를 선택해주세요.', 'warning');
    }

    try {
      // 서버에 식물 상태 변경(archive) 요청 전송 (PATCH 메서드 사용)
      // url 파라미터로 식물 ID, 바디로 사망 이유 전달
      await api.patch(`/api/plants/${plant.id}/archive`, {
        death_reason: reason
      });
      
      // 성공 시 알림 표시
      Swal.fire('수정 완료', '식물 정보가 수정되었습니다.', 'success');
      
      onSaved(); // 부모 컴포넌트의 목록 새로고침 함수 호출
      onClose(); // 모달 닫기
    } catch {
      // API 요청 실패 시 에러 알림 표시
      Swal.fire('수정 실패', '식물 정보 수정에 실패하였습니다', 'error');
    }
  };

  return (
    // 모달 배경(Overlay) 클릭 시 모달 닫기
    <div className="modal-overlay" onClick={onClose}>
      {/* 모달 내부 컨텐츠 클릭 시에는 닫기 이벤트(onClick)가 상위로 전파되지 않도록 방지 */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>식물 상태 수정</h3>
        
        {/* 수정 대상 식물의 이름과 종 정보 표시 */}
        <p className="plant-name-display">
          <strong>{plant.plant_name}</strong> ({plant.species})
        </p>

        {/* 사망 이유 선택 드롭다운 영역 */}
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

        {/* 하단 버튼 영역 (저장/취소) */}
        <div className="modal-actions">
          <button className="save-btn" onClick={handleSubmit}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

export default EditPlantModal;