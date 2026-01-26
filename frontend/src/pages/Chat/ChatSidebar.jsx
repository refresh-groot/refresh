import React from 'react'
import { FaTimes, FaPlus } from 'react-icons/fa';

// 사이드바 컴포넌트: 열림 상태(isOpen)와 채팅 기록 데이터(chats)를 받아 렌더링
const ChatSidebar = ({isOpen, chats, onClose, onNewChat, onSelectChat}) => {


    return (
    // isOpen이 true일 때만 'open' 클래스를 추가하여 CSS로 화면에 표시 (슬라이드 효과)
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        
        {/* 상단 헤더: 제목과 닫기 버튼 배치 */}
        <div className='sidebar-header'>
            <h3>진단 기록</h3>
            <button className='close-btn' onClick={onClose}>
                <FaTimes />
            </button>
        </div>

        {/* 새 진단 시작 버튼 영역 */}
        <div className="new-chat-wrapper">
        <button className="new-chat-btn" onClick={onNewChat}>
            <FaPlus /> 새 진단 시작
        </button>
    </div>

    {/* 채팅 기록 리스트 영역 */}
    <div className="chat-list-container">
        <p className='list-label'>최근 기록</p>
        <ul className='chat-list'>
            {/* 부모 컴포넌트에서 받은 배열 데이터를 순회하며 리스트 아이템 생성 */}
            {chats.map((chat) => (
                // 리액트 리스트 렌더링 성능 최적화를 위해 고유 key 필수
                <li key={chat.id} className='chat-item' onClick={() => onSelectChat(chat)}>
                    <span className='chat-title'>{chat.title}</span>
                    <span className='chat-date'>{chat.date}</span>
                </li>
            ))}
        </ul>
        </div>
    </div>
    );
};

export default ChatSidebar