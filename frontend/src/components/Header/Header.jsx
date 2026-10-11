import React, { useState } from 'react';
import './Header.css';
import RefreshLogo from '../../assets/img/Refresh_Logo.png';
import { FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../app/constants';

function Header() {
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if(!isLoggedIn) return null;

  const closeMenu = () => {
    setIsOpen(false);
  }

  const handleRefresh = (e) => {
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
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <ul>
            <li><Link to="/Profile" onClick={closeMenu}>PROFILE</Link></li>
            <li><Link to="/Community" onClick={closeMenu}>COMMUNITY</Link></li>
            <li><Link to="/setting" onClick={closeMenu}>SETTINGS</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;
