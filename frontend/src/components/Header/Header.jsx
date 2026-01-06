import React, { useState } from 'react';
import './Header.css';
import RefreshLogo from '../../assets/img/Refresh_Logo.png';
import { FaBars } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../app/alert';
import { APP_NAME } from '../../app/constants';
function Header() {

const { isLoggedIn, logout } = useAuth();
const navigate = useNavigate();
const [isOpen, setIsOpen] = useState(false);

if(!isLoggedIn) return null;

const toggleMenu =() =>{
setIsOpen(!isOpen);
}

const closeMenu = () => {
  setIsOpen(false);
}


const handleLogout = () =>{
  showAlert('success', '성공', '로그아웃에 성공했습니다.');
  logout();
  navigate('/login');
}

const handleRefresh = (e) =>{
  e.preventDefault();
  window.location.href = '/menu';
}

  return (
    <header>
    <nav className="navbar">
      <div className='nav-logo'>
      <a href='/' onClick={handleRefresh}>
        <img src={RefreshLogo} alt="Refresh_Logo" className="logo-img"/>
        {APP_NAME}
        </a>
      </div>
      <div className="navbar-toggle" onClick={toggleMenu}>
        <FaBars/>
      </div>
      <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
        <ul>
        <li><Link to="/Profile" onClick={closeMenu}>PROFILE</Link></li>
        <li><Link to="/Community" onClick={closeMenu}>COMMUNITY</Link></li>
        <li><Link to="#" onClick={closeMenu}>SETTINGS</Link></li>
        <li><Link to="/" onClick={handleLogout}>LOGOUT</Link></li>
        </ul>
      </div>
    </nav>
    </header>
  );
}

export default Header;