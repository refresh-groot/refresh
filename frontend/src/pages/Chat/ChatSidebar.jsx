import React, { useEffect, useState } from 'react'
import { FaTimes, FaPlus, FaPen, FaTrash, FaEllipsisV } from 'react-icons/fa';

const ChatSidebar = ({isOpen, chats, onClose, onNewChat, onSelectChat, onDeleteChat, onRenameChat}) => {

    const [activeMenuId, setActiveMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isClosing, setIsClosing] = useState(false);

    // 모달 상태 추가
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [targetChatId, setTargetChatId] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMenuClick = (e, chatId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isUp = windowHeight - rect.bottom < 150;

        setMenuPosition({
            top: isUp ? rect.top - 70 : rect.top,
            left: rect.right + 10,
        });

        setActiveMenuId(activeMenuId === chatId ? null : chatId);
    };
    
    const handleDelete = (e, chatId) => {
        e.stopPropagation();
        setTargetChatId(chatId);
        setShowDeleteModal(true);
        handleCloseMenu();
    };
    
    const handleRename = (e, chatId) => {
        e.stopPropagation();
        console.log("메뉴에서 선택한 ID:", chatId);
        setTargetChatId(chatId);
        setEditName(''); 
        setShowRenameModal(true);
        handleCloseMenu();
    };

    const handleCloseMenu = () => {
        setIsClosing(true);
        setTimeout(() => {
            setActiveMenuId(null);
            setIsClosing(false);
        }, 300);
    }

    return (
        <>
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
                                    <button className="edit-trigger" onClick={(e) => handleMenuClick(e, chat.id)}>
                                        <FaEllipsisV/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 기존 메뉴 오버레이 */}
            {activeMenuId !== null && (
                <>
                    <div className={`menu-overlay ${isMobile ? 'mobile-dim' : ''}`} onClick={handleCloseMenu} />
                    <div className={`edit-menu ${isMobile ? 'bottom-sheet' : 'pc-menu'} ${isClosing ? 'closing' : ''}`}
                        style={!isMobile ? { position: 'fixed', top: menuPosition.top, left: menuPosition.left, zIndex: 9999 } : { zIndex: 9999 }}>
                        {isMobile && <div className='sheet-handle' />}
                        <button className='rename-btn' onClick={(e) => handleRename(e, activeMenuId)}>
                            <FaPen/> 이름 변경
                        </button>
                        <button className='delete-btn' onClick={(e) => handleDelete(e, activeMenuId)}>
                            <FaTrash/> 삭제
                        </button>
                        {isMobile && <button className='sheet-close' onClick={handleCloseMenu}>취소</button>}
                    </div>
                </>
            )}

            {/* 이름 변경 커스텀 모달 */}
            {showRenameModal && (
                <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
                    <div className="custom-modal" onClick={e => e.stopPropagation()}>
                        <h2>이름 변경</h2>
                        <input className="modal-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="새 이름을 입력하세요" />
                        <div className="modal-btn-group">
                            <button className="btn-cancel" onClick={() => setShowRenameModal(false)}>취소</button>
                            <button className="btn-confirm" onClick={() => { console.log("변경 클릭, 현재 ID:", activeMenuId);onRenameChat(targetChatId, editName); setShowRenameModal(false); }}>변경</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 커스텀 모달 */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="custom-modal" onClick={e => e.stopPropagation()}>
                        <h2>삭제하시겠습니까?</h2>
                        <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>삭제 후 복구할 수 없습니다.</p>
                        <div className="modal-btn-group">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>취소</button>
                            <button className="btn-delete" onClick={() => { onDeleteChat(targetChatId); setShowDeleteModal(false); }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatSidebar;