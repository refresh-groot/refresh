import React, { Children, createContext, useContext, useState } from 'react'
//로그인 여부 등 전역상태 관리
const AuthContext = createContext(null);
//사용자 정보를 저장하는 상태
export const AuthProvider =({children}) =>{
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
//로그인 상태 유지
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('user') !== null;
  })
//로그인 기능
const login = (userData) => {
  setUser(userData);
  setIsLoggedIn(true);
  localStorage.setItem('user', JSON.stringify(userData));
};
//로그아웃 기능
const logout = () => {
  setUser(null);
  setIsLoggedIn(false);
  localStorage.removeItem('user');
};
// 데이터 제공
  return (
    <AuthContext.Provider value={{user, isLoggedIn, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
//커스텀 훅 생성
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
export default AuthContext