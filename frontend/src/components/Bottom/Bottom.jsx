import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import './Bottom.css';
import { BsPersonFill, BsPeopleFill, BsGearFill, BsBoxArrowRight } from "react-icons/bs";

const Bottom = ({hidden}) => {
    const navigate = useNavigate();

    const location = useLocation();

    const NAV_ITEMS = [
        {id: 'profile', label: '프로필', path: '/menu', icon: <BsPersonFill />},
        {id: 'community', label: '커뮤니티', path: '/community', icon: <BsPeopleFill />},
        {id: 'setting', label: '설정', path: '/setting', icon: <BsGearFill />},
        {id: 'logout', label: '로그아웃', path: '/logout', icon: <BsBoxArrowRight/>}
    ];

    const handleNavClick = (item) => {
        if(item.action === 'logout') {
            if(window.confirm('정말 로그아웃 하시겠습니까?')) {
                navigate('/login');
            }
        } else{
            navigate(item.path);
        }
    };

  return (
    <div className={`bottom-nav-container ${hidden ? 'hidden' : ''}`}>
        {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.includes(item.path);
        return (
        <div
        key={item.id}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => handleNavClick(item)}>
            <div className="nav-icon">{item.icon}</div>
            <span className='nav-label'>{item.label}</span>
        </div>
        );
})}
    </div>
  );
}

export default Bottom