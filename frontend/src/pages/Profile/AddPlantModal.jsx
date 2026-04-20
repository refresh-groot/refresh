import React, { useState } from 'react'
import './AddPlantModal.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import { Bluetooth } from '../../hooks/Bluetooth';
import { FaTimes, FaCamera } from 'react-icons/fa';
import defaultImg from '../../assets/img/default.png';
import { showAlert } from '../../app/alert';
import { useBluetooth } from '../../context/BluetoothContext';
// 새 식물을 등록하기 위한 모달 컴포넌트
// 사용자가 입력한 이름, 종, 날짜, 사진 정보를 부모 컴포넌트(Profile)로 전달하는 역할을 함
function AddPlantModal({onClose, onSave}) {
    // 폼 입력값 상태 관리 (이름, 종, 등록일)
    const [nickname, setNickname] =useState('');
    const [species, setSpecies] = useState(''); 
    const [date, setDate] = useState(new Date()); 
    const { handleConnectSuccess } = useBluetooth();
    
    // 이미지 업로드 관련 상태 (화면 표시용 미리보기 URL, 실제 전송용 파일 객체)
    const [preview, setPreview] = useState(defaultImg);
    const [file, setFile] = useState(null);
    const [deviceId, setDeviceId] = useState(null);

    // 이미지 파일 선택 시 실행되는 핸들러
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if(selected) {
            setFile(selected);
            // 브라우저 메모리에 임시 URL을 생성하여 즉시 미리보기 표시
            setPreview(URL.createObjectURL(selected));
        }
    };

    // 폼 제출(등록하기 버튼) 핸들러
    const handleSubmit = (e) => {
        e.preventDefault(); // 기본 폼 제출 동작(새로고침) 방지
        
        // 필수 입력값 유효성 검사
        if(!nickname || !species || !date){
            return showAlert('warning', '정보 부족', '모든 정보를 입력해주세요.');
        }
        const formattedDate = date.toISOString().split('T')[0];

    // 부모 컴포넌트의 저장 함수 호출 (데이터 전달)
    onSave(nickname, species, date, file);
    onClose(); // 저장 후 모달 닫기
};

    return (
    // 모달 배경(Overlay) 클릭 시 닫기
    <div className="modal-overlay" onClick={onClose}>
        {/* 모달 내부 클릭 시에는 닫기 이벤트가 전파되지 않도록 방지 */}
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className='close-btn' onClick={onClose}>
                <FaTimes/>
            </button>
            <h2>새 식물 등록</h2>
            <form onSubmit={handleSubmit}>
                {/* 이미지 업로드 영역 */}
                <div className="modal-img-upload">
                    <img src={preview} alt="미리보기" />
                    {/* input[type="file"]은 숨기고, 라벨(카메라 아이콘)을 클릭하여 파일창을 염 */}
                    <label htmlFor="modal-file" className='modal-camera-btn'>
                        <FaCamera/>
                    </label>
                    <input type="file" id="modal-file" style={{display:'none'}} onChange={handleFileChange} />
                </div>

                {/* 식물 정보 입력 필드 그룹 */}
                <div className="modal-input-group">
                    <label>식물 종류</label>
                    <input 
                    type="text"
                    placeholder="예: 장미, 몬스테라" 
                    value={species} onChange={(e)=> setSpecies(e.target.value)} 
                    />
                </div>

                <div className="modal-input-group">
                    <label>식물 이름</label>
                    <input 
                    type="text"
                    placeholder="예: 1호" 
                    value={nickname} onChange={(e)=> setNickname(e.target.value)} 
                    />
                </div>

                <div className="modal-input-group">
                    <label>등록 날짜</label>
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
    <label>기기 연동</label>
    <Bluetooth onConnectSuccess={(info) => {
  handleConnectSuccess(info);
  console.log("연결된 기기:", info?.deviceName);
}} />
</div>

                <button type="submit" className="modal-submit-btn">등록하기</button>
            </form>
        </div>
    </div>
  );
}

export default AddPlantModal;