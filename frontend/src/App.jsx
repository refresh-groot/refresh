import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { lazy, Suspense} from 'react'
import Layout from './layout/Layout';
import Bottom from './components/Bottom/Bottom';
import { BluetoothProvider } from './context/BluetoothContext';
import { AuthProvider } from './context/AuthContext';
const Login = lazy(() => import('./pages/Login/Login'));
const Menu = lazy(() => import('./pages/Menu/Menu'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Community = lazy(() => import('./pages/Community/Community'));
const Chat = lazy(() => import('./pages/Chat/Chat'))
const Setting = lazy(() => import('./pages/Setting/Setting'))

// 1. Lazy Loading: 초기 로딩 시 모든 페이지를 불러오지 않고 필요할때만 불러옴
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>페이지를 불러오는 중입니다...</p>
  </div>
);

function App() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const hideBottomPaths = ['/', '/chat'];
  const shouldHideBottom = hideBottomPaths.includes(currentPath);

return (
  <AuthProvider>
    <BluetoothProvider>
    <div className="app-container">
    
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>  {/* 상단 헤더바를 필요한 라우터에 적용하기 위해 가장 위에 넣고 아래에 메뉴 및 커뮤니티 작성 */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/Setting" element={<Setting />} />
        </Route>

        {/* 3. 잘못된 경로 처리 (404 예방): 정의되지 않은 주소로 접속 시 로그인 페이지로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Bottom hidden={shouldHideBottom} />
    </Suspense>
    </div>
    </BluetoothProvider>
  </AuthProvider>
);
}

export default App;