import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../app/constants'; // 상수 경로 확인 필요

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  //loading 상태 추가 (처음엔 true로 설정하여 "확인 중"임을 알림)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/user/check`, {
            withCredentials: true 
        });
        
        if (response.data.user) {
          setUser(response.data.user);
        } else {
            setUser(null);
        }
      } catch(error) {
        console.error("로그인 체크 실패:", error);
        // 에러 시 로그아웃 상태로 간주
        setUser(null);
      } finally {
        //성공하든 실패하든 확인이 끝났으니 로딩 종료
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
        await axios.post(`${SERVER_URL}/api/user/logout`);
        setUser(null);
    } catch(err) {
        console.error(err);
        setUser(null);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
//커스텀 훅 생성
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
export default AuthContext