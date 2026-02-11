import React, { useState } from 'react'
import { FaTimes, FaPlus, FaPen, FaTrash, FaEllipsisV } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ChatSidebar = ({isOpen, chats, onClose, onNewChat, onSelectChat, onDeleteChat, onRenameChat}) => {

    const [activeMenuId, setActiveMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [menuDirection, setMenuDirection] = useState('down');

    const handleMenuClick = (e, chatId) => {
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const isUp = windowHeight - rect.bottom < 150;
        setMenuDirection(isUp ? 'up' : 'down');

        // 버튼 오른쪽에 메뉴가 붙도록 fixed 좌표 계산
        setMenuPosition({
            top: isUp ? rect.top - 70 : rect.top,
            left: rect.right + 10,
        });

        setActiveMenuId(activeMenuId === chatId ? null : chatId);
    };
    
    const handleDelete = (e, chatId) => {
        e.stopPropagation();
        Swal.fire({
            title: '삭제하시겠습니까?',
            text: '삭제 후 복구할 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            confirmButtonColor: '#d33',
        }).then((res) => {
            if(res.isConfirmed) onDeleteChat(chatId);
            setActiveMenuId(null);
        });
    };
    
    const handleRename = (e, chatId) => {
        e.stopPropagation();
        Swal.fire({
            title: '이름 변경',
            input: 'text',
            inputValue: null,
            showCancelButton: true,
            confirmButtonText: '변경',
            cancelButtonText: '취소',
        }).then((res) => {
            if(res.isConfirmed && res.value){
                onRenameChat(chatId, res.value);
            }
            setActiveMenuId(null);
        });
    };

    return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        
        <div className='sidebar-header'>
            <h3>진단 기록</h3>
            <button className='close-btn' onClick={onClose}>
                <FaTimes />
            </button>
        </div>

        <div className="new-chat-wrapper">
            <button className="new-chat-btn" onClick={onNewChat}>
                <FaPlus /> 새 진단 시작
            </button>
        </div>

        <div className="chat-list-container">
            <p className='list-label'>최근 기록</p>
            <ul className='chat-list'>
                {chats.map((chat) => (
                <li key={chat.id} className='chat-item' onClick={() => onSelectChat(chat)}>
                    <span className='chat-title'>{chat.title}</span>
                    <span className='chat-date'>{chat.date}</span>

                    <div className="edit-container" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="edit-trigger"
                            onClick={(e) => handleMenuClick(e, chat.id)}
                        >
                            <FaEllipsisV/>
                        </button>
                    </div>
                </li>
                ))}
            </ul>
        </div>

        {/* 메뉴를 사이드바 밖, Portal처럼 fixed로 렌더링 */}
        {activeMenuId !== null && (
            <>
                <div 
                    className="menu-overlay" 
                    onClick={() => setActiveMenuId(null)} 
                />
                <div 
                    className={`edit-menu ${menuDirection}`}
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 9999,
                    }}
                >
                    <button className='rename-btn' onClick={(e) => handleRename(e, activeMenuId)}>
                        <FaPen/> 이름 변경
                    </button>
                    <button className='delete-btn' onClick={(e) => handleDelete(e, activeMenuId)}>
                        <FaTrash/> 삭제
                    </button>
                </div>
            </>
        )}
    </div>
    );
};

export default ChatSidebar;