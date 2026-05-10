import React, { useState } from 'react'
import './CommunityWrite.css';
import { useNavigate } from 'react-router-dom';
import { showAlert, showToast } from '../../app/alert';
import Swal from 'sweetalert2';

const CommunityWrite = () => {

    const [category, setCategory] = useState('질문');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = () => {
        if(!title.trim()) {Swal.fire('알림', '제목을 입력해주세요.', 'warning'); return;}
        if(!content.trim()) {Swal.fire('알림', '내용을 입력해주세요.', 'warning'); return;}

        showAlert('success', '성공', '게시글이 등록되었습니다.', 1000)
        .then(() => navigate('/community'));
    };

  return (
    <div className="write-page">
    <div className="write-inner">
        <div className="write-left">
        <div className="write-field">
            <div className="write-field-label">카테고리</div>
            <div className="write-category">
            {['질문','정보공유','자랑','고민'].map((item) => (
                <button key={item} className={`category-btn ${category === item ? 'active' : ''}`}
                onClick={() => setCategory(item)}>
                {item}
                </button>
            ))}
            </div>
        </div>
        <div className="write-field">
            <div className="write-field-label">제목</div>
            <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}/>
        </div>
        <div className="write-field">
            <div className="write-field-label">내용</div>
            <textarea
            name="content"
            placeholder='내용을 입력하세요'
            value={content}
            onChange={(e) => setContent(e.target.value)}/>
        </div>
        <div className="write-field">
            <div className="write-field-label">사진 첨부</div>
            <label className="file-upload-label">
    {image ? image.name : '@ 사진 선택 (최대 3장)'}
    <input 
        type="file"
        accept='image/*'
        style={{ display: 'none' }}
        onChange={(e) => setImage(e.target.files[0])}/>
    </label>
        </div>
        </div>
        <div className="write-right">
            <button className="write-submit-btn" onClick={handleSubmit}>등록하기</button>
            <button className="write-cancel-btn" onClick={() => navigate('/community')}>취소</button>
            <div className="write-tip">
                <div className="tip-title">작성 가이드</div>
                <ul>
                    <li>식물 관련 내용만 작성해주세요</li>
                    <li>욕설·비방 게시글은 삭제됩니다</li>
                    <li>사진은 최대 3장까지 첨부 가능</li>
                    <li>카테고리를 정확히 선택해주세요</li>
                </ul>
            </div>
        </div>
        </div>
        </div>
)
}

export default CommunityWrite