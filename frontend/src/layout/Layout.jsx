import Header from '../components/Header/Header.jsx';
import { Outlet, useLocation } from 'react-router-dom';
import Bottom from '../components/Bottom/Bottom.jsx';
import './Layout.css';

function Layout() {
  const location = useLocation();
  const isChat = location.pathname.toLowerCase() === '/chat';
  return (
    <div className="layout">
      <Header /> {/* 고정된 상단바 */}
      
      <main className="main-content" style={{ paddingBottom: isChat ? '0' : '70px' }}>
        <Outlet /> {/* Menu, Settings 등으로 바뀌는 부분 */}
      </main>
    </div>
  );
}
export default Layout;