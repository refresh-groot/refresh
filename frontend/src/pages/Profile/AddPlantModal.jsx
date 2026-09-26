import React, { useState } from 'react'
import './AddPlantModal.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import { Bluetooth } from '../../components/Bluetooth/Bluetooth';
import { FaTimes, FaCamera, FaBluetooth } from 'react-icons/fa';
import defaultImg from '../../assets/img/default.png';
import { showAlert, showToast } from '../../app/alert';
import { useBluetooth } from '../../hooks/useBluetooth';
// 새 식물을 등록하기 위한 모달 컴포넌트
// 사용자가 입력한 이름, 종, 날짜, 사진 정보를 부모 컴포넌트(Profile)로 전달하는 역할을 함
function AddPlantModal({onClose, onSave}) {
    // 폼 입력값 상태 관리 (이름, 종, 등록일)
    const [nickname, setNickname] = useState('');
    const [species, setSpecies] = useState(''); 
    const [date, setDate] = useState(new Date()); 
    
    // [수정] 중복 선언을 방지하기 위해 여기서 한꺼번에 가져옵니다.
    const { sendCommand } = useBluetooth();
    
    // 이미지 업로드 관련 상태 (화면 표시용 미리보기 URL, 실제 전송용 파일 객체)
    const [preview, setPreview] = useState(defaultImg);
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 이미지 파일 선택 시 실행되는 핸들러
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if(selected) {
            setFile(selected);
            // 브라우저 메모리에 임시 URL을 생성하여 즉시 미리보기 표시
            setPreview(URL.createObjectURL(selected));
        }
    };

    // 폼 제출(등록하기 버튼) 핸들러 - async 함수
    const handleSubmit = async (e) => {
        e.preventDefault(); // 기본 폼 제출 동작(새로고침) 방지
        
        // 필수 입력값 유효성 검사
        if(!nickname.trim() || !species.trim() || !date){
            return showAlert('warning', '정보 부족', '모든 정보를 입력해주세요.');
        }

        try {
            setIsSubmitting(true);
            // 부모 컴포넌트의 저장 함수 호출 후 결과(ID)를 기다림
            const result = await onSave(nickname, species, date, file);
            
            // 서버 응답 구조에서 ID 추출
            const newPlantId = result?.plant?.id ?? result?.id ?? result?.plant_id;

            // ID가 존재하고 블루투스가 연결되어 있다면 기기로 전송
            if (newPlantId && sendCommand) {
                await sendCommand(`SET_ID ${newPlantId}`);
                showToast('success', '기기 연동이 완료되었습니다.');
            }

            onClose(); // 모든 작업 완료 후 모달 닫기
        } catch (err) {
            console.error("등록 및 연동 실패:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
    // 모달 배경(Overlay) 클릭 시 닫기
    <div className="modal-overlay" onClick={onClose}>
        {/* 모달 내부 클릭 시에는 닫기 이벤트가 전파되지 않도록 방지 */}
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className='close-btn' onClick={onClose}>
                <FaTimes/>
            </button>
            <div className="plant-modal-heading">
                <p>MY PLANT</p>
                <h2>식물 등록</h2>
                <span>식물의 기본 정보를 입력해주세요.</span>
            </div>
            <form onSubmit={handleSubmit}>
                {/* 이미지 업로드 영역 */}
                <div className="modal-img-upload">
                    <img src={preview} alt="미리보기" />
                    {/* input[type="file"]은 숨기고, 라벨(카메라 아이콘)을 클릭하여 파일창을 염 */}
                    <label htmlFor="modal-file" className='modal-camera-btn'>
                        <FaCamera/>
                    </label>
                    <input type="file" id="modal-file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
                </div>
                <p className="image-upload-guide">사진은 선택 사항이에요</p>

                {/* 식물 정보 입력 필드 그룹 */}
                <div className="modal-input-group">
                    <label htmlFor="plant-nickname">식물 별명 <em>*</em></label>
                    <input 
                    id="plant-nickname"
                    type="text"
                    placeholder="예: 거실 몬스테라"
                    value={nickname} onChange={(e)=> setNickname(e.target.value)}
                    />
                </div>

                <div className="modal-input-group">
                    <label htmlFor="plant-species">식물 종류 <em>*</em></label>
                    <input 
                    id="plant-species"
                    type="text"
                    placeholder="예: 몬스테라, 스투키"
                    value={species} onChange={(e)=> setSpecies(e.target.value)}
                    />
                </div>

                <div className="modal-input-group">
                    <label>함께 키우기 시작한 날</label>
                    <div className="datepicker-container">
                        <DatePicker
                            selected={date}
                            onChange={(selectedDate) => setDate(selectedDate)}
                            locale={ko}
                            dateFormat="yyyy.MM.dd"
                            maxDate={new Date()}
                            className="modal-datepicker-input"
                            shouldCloseOnSelect={true}
                        />
                    </div>
                </div>

                <div className="modal-input-group ble-group">
                    <div className="ble-group__heading">
                        <label><FaBluetooth /> 기기 연동 <small>선택</small></label>
                        <span>나중에 설정에서 연결할 수 있어요.</span>
                    </div>
                    <Bluetooth />
                </div>

                <button type="submit" className="modal-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? '등록 중...' : '식물 등록하기'}
                </button>
            </form>
        </div>
    </div>
  );
}

export default AddPlantModal;
