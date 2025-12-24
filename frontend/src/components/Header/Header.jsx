import React, { useState } from 'react';
import './Header.css';
import RefreshLogo from '../../assets/Refresh_Logo.png';
import { FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Header() {

const [isOpen, setIsOpen] = useState(false);
const toggleMenu =() =>{
setIsOpen(!isOpen);
}

const handleRefresh = (e) =>{
  e.preventDefault();
  window.location.href = '/menu';
}

const handleLogout = (e) =>{
  e.preventDefault();
  window.location.href = '/';
}

  return (
    <header>
    <nav className="navbar">
      <div className='nav-logo'>
      <a href='/' onClick={handleRefresh}>
        <img src={RefreshLogo} alt="Refresh_Logo" className="logo-img"/>
        Refresh
        </a>
      </div>
      <div className="navbar-toggle" onClick={toggleMenu}>
        <FaBars/>
      </div>
      <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
        <ul>
        <li><Link to="/menu" onClick={handleRefresh}>HOME</Link></li>
        <li><Link to="#">MY PLANT</Link></li>
        <li><Link to="/Community">COMMUNITY</Link></li>
        <li><Link to="#">SETTINGS</Link></li>
        <li><Link to="/" onClick={(handleLogout)}>LOGOUT</Link></li>
        </ul>
      </div>
    </nav>
    </header>
  );
}

export default Header;