import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Chat.css';
import { FaPlus } from "react-icons/fa6";

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const plant = location.state?.plant || { plant_name: '반려식물' };
  const [inputText, setInputText] = useState('');

  const suggestions = [
    "🍃 잎이 갈색으로 변해요",
    "💧 물은 언제 줘야 하나요?",
    "☀️ 햇빛이 부족한 것 같아요",
    "🐛 벌레가 생긴 것 같아요"
  ];

  return (
    <div className="chat-container">
      <div className="chat-view">
        <div className="content-width">
          
          <div className="empty-state">
            <div className="ai-logo">🌱</div> 
            <h2>안녕하세요, {plant.plant_name} 진단 AI입니다.</h2>
            <p>식물 사진을 올리거나, 궁금한 증상을 물어보세요.</p>
            <div className="suggestion-grid">
              {suggestions.map((text, index) => (
                <button 
                  key={index} 
                  className="suggestion-card"
                  onClick={() => setInputText(text)} 
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
          <div className="bottom-spacer"></div>
        </div>
      </div> 
      <div className="input-section">
        <div className="content-width">
          <div className="input-box">
            <button className='icon-btn'><FaPlus /></button>
            <input
              type="text"
              placeholder={`${plant.plant_name}에 대해 물어보세요.`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && alert('전송 기능 준비 중!')}
            />
            <button className='send-btn' onClick={() => alert('전송!')}>➤</button>
          </div>
          <p className='disclaimer'>AI는 실수를 할 수 있습니다. 정확한 정보는 전문가와 상담하세요.</p>
        </div>
      </div>

    </div>
  );
}

export default Chat;