import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { showAlert } from '../../app/alert';
import './CommunityWrite.css';
import api from '../../api/axios';

    const CommunityWrite = () => {
    const navigate = useNavigate();

    const [category, setCategory] = useState('질문');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);

    const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const newImages = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages].slice(0, 3));
    e.target.value = '';
    };

    const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
    if (!title.trim()) return Swal.fire('알림', '제목을 입력해주세요.', 'warning');
    if (!content.trim()) return Swal.fire('알림', '내용을 입력해주세요.', 'warning');

    try {
        let res;
        if (images.length > 0) {
        const formData = new FormData();
            formData.append('category', category);
            formData.append('title', title);
            formData.append('content', content);
            images.forEach((img) => formData.append('image', img.file));
            res = await api.post('/api/community', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        } else {
            res = await api.post('/api/community', { category, title, content });
        }

        await showAlert('success', '성공', '게시글이 등록되었습니다.', 1000);
        navigate('/community');
        } catch (error) {
        console.error('등록 실패:', error);
        Swal.fire('오류', '게시글 등록에 실패했습니다.', 'error');
    }
    };

    return (
        <div className="write-page">
        <div className="write-inner">
        
            <div className="write-left">

            <div className="write-field">
            <div className="write-field-label">카테고리</div>
            <div className="write-category">
                {['질문', '정보공유', '자랑', '고민'].map((item) => (
                <button
                key={item}
                className={`category-btn ${category === item ? 'active' : ''}`}
                onClick={() => setCategory(item)}
                >
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
                onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="write-field">
            <div className="write-field-label">내용</div>
            <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                />
            </div>

            <div className="write-field">
            <div className="write-field-label">사진 첨부</div>
            <div className="file-upload-wrapper">
                <label className="file-upload-label">
                <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                multiple
                />
                
                {images.length === 0 && '📎 사진 선택 (최대 3장)'}

                {images.length > 0 && (
            <div className="write-preview-container">
                {images.map((img, index) => (
            <div key={index} className="inner-image-preview">
                <img src={img.preview} alt="미리보기" />
                <button
                type="button"
                className="remove-img-btn"
                onClick={(e) => {
                e.preventDefault();
                removeImage(index);
                }}
                >
                <FaTimes />
                </button>
            </div>
            ))}
                {images.length < 3 && <div className="add-more-box">+</div>}
            </div>
            )}
                </label>
            </div>
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
);
};

export default CommunityWrite;