//App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { lazy, Suspense} from 'react'
import Layout from './layout/Layout';
import Bottom from './components/Bottom/Bottom';
import { BluetoothProvider } from './context/BluetoothContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { DashboardSkeleton } from './components/Skeleton/Skeleton';
const Login = lazy(() => import('./pages/Login/Login'));
const Menu = lazy(() => import('./pages/Menu/Menu'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Community = lazy(() => import('./pages/Community/Community'));
const Chat = lazy(() => import('./pages/Chat/Chat'))
const Setting = lazy(() => import('./pages/Setting/Setting'))
const CommunityWrite = lazy(() => import('./pages/Community/CommunityWrite'));
const CommunityDetail = lazy(() => import('./pages/Community/CommunityDetail'));

function App() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const hideBottomPaths = ['/', '/chat'];
  const shouldHideBottom = hideBottomPaths.includes(currentPath);

return (
  <AuthProvider>
    <BluetoothProvider>
    <div className="app-container">
    <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>  {/* 상단 헤더바를 필요한 라우터에 적용하기 위해 가장 위에 넣고 아래에 메뉴 및 커뮤니티 작성 */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/write" element={<CommunityWrite />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/setting" element={<Setting />} />
        </Route>

        {/* 3. 잘못된 경로 처리 (404 예방): 정의되지 않은 주소로 접속 시 로그인 페이지로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Bottom hidden={shouldHideBottom} />
    </Suspense>
    </ErrorBoundary>
    </div>
    </BluetoothProvider>
  </AuthProvider>
);
}

export default App;
