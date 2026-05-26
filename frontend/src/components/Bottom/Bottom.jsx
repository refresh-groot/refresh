import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Bottom.css';
import { MdHome, MdEco, MdGroup, MdSettings } from "react-icons/md";
import QuickMenu from './QuickMenu';

const Bottom = ({ hidden }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isQuickOpen, setIsQuickOpen] = useState(false);

  const NAV_ITEMS = [
    { id: 'menu', label: '홈', path: '/menu', icon: <MdHome /> },
    { id: 'profile', label: '내 식물', path: '/profile', icon: <MdEco /> },
    { id: 'community', label: '커뮤니티', path: '/community', icon: <MdGroup /> },
    { id: 'setting', label: '설정', path: '/setting', icon: <MdSettings /> }
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  const renderNavItem = (item) => {
    const isActive = location.pathname.includes(item.path);
    return (
      <div
        key={item.id}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => handleNavClick(item)}
      >
        <div className="nav-icon">{item.icon}</div>
        <span className="nav-label">{item.label}</span>
      </div>
    );
  };

  return (
    <>
      <div className={`bottom-nav-container ${hidden ? 'hidden' : ''}`}>
        <div className="nav-group-left">
          {NAV_ITEMS.slice(0, 2).map(renderNavItem)}
        </div>
        
        <button className="quick-btn" onClick={() => setIsQuickOpen(!isQuickOpen)}>
          +
        </button>

        <div className="nav-group-right">
          {NAV_ITEMS.slice(2).map(renderNavItem)}
        </div>
      </div>

      {isQuickOpen && (
        <QuickMenu
          onClose={() => setIsQuickOpen(false)}
          currentPlant={JSON.parse(localStorage.getItem('my-plants'))?.[0]}
        />
      )}
    </>
  );
};

export default Bottom;