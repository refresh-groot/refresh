import React, { useState } from 'react'
import './AddPlantModal.css';
import { FaTimes, FaCamera } from 'react-icons/fa';
import defaultImg from '../../assets/img/rose.png';
import { showAlert } from '../../app/alert';

function AddPlantModal({onClose, onSave}) {
    const [nickname, setNickname] =useState('');
    const [species, setSpecies] = useState(''); 
    const [date, setDate] = useState(''); 
    const [preview, setPreview] = useState(defaultImg);
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if(selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!nickname || !species || !date){
            return showAlert('warning', '정보 부족', '모든 정보를 입력해주세요.');
        }
    

    const newPlant = {
    id: Date.now(),
    name: species,
    nickname: nickname,
    startDate: date,
    img: preview
    };

    onSave(newPlant);
    onClose();
};




  return (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className='close-btn' onClick={onClose}>
                <FaTimes/>
            </button>
            <h2>새 식물 등록</h2>
            <form onSubmit={handleSubmit}>
                <div className="modal-img-upload">
                    <img src={preview} alt="미리보기" />
                    <label htmlFor="modal-file" className='modal-camera-btn'>
                        <FaCamera/>
                    </label>
                    <input type="file" id="modal-file" style={{display:'none'}} onChange={handleFileChange} />
                </div>

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
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
          <button type="submit" className="modal-submit-btn">등록하기</button>
            </form>
        </div>
    </div>
  );
}

export default AddPlantModal