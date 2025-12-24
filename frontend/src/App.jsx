import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Menu from './pages/Menu/Menu';   
import Community from './pages/Community/Community';  
import Layout from './layout/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
      <Route path="/menu" element={<Menu />} />
      <Route path="/community" element={<Community />} />
      </Route>
    </Routes>
  );
}

export default App;