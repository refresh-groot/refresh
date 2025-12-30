import { Routes, Route, Navigate } from 'react-router-dom';
import React, { lazy, Suspense} from 'react'
import Layout from './layout/Layout';
const Login = lazy(() => import('./pages/Login/Login'));
const Menu = lazy(() => import('./pages/Menu/Menu'));
const Community = lazy(() => import('./pages/Community/Community'));
// 1. Lazy Loading: 초기 로딩 시 모든 페이지를 불러오지 않고 필요할때만 불러옴
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>페이지를 불러오는 중입니다...</p>
  </div>
);

function App() {
  return (
    // 2. Suspense: 지연 로딩되는 컴포넌트가 준비될 동안 보여줄 UI를 지정함.
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>  {/* 상단 헤더바를 필요한 라우터에 적용하기 위해 가장 위에 넣고 아래에 메뉴 및 커뮤니티 작성 */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/community" element={<Community />} />
        </Route>

        {/* 3. 잘못된 경로 처리 (404 예방): 정의되지 않은 주소로 접속 시 로그인 페이지로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;