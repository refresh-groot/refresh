import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import './Login.css'
import { checkIdApi, checkNicknameApi, signupApi, loginApi, sendEmailCodeApi, verifyEmailCodeApi } from '../../api/auth';
import { showAlert } from '../../app/alert';
import useInput from '../../hooks/useInput';
import Agreement from '../../components/Agreement/Agreement';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { SiNaver } from 'react-icons/si';
import { FaGithub } from 'react-icons/fa';
import { SERVER_URL } from '../../app/constants';

function Login() {
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    aiData: false,
  });
  const [allAgreed, setAllAgreed] = useState(false);

  const handleAgreement = (key) => {
    const updated = { ...agreements, [key]: !agreements[key] };
    setAgreements(updated);
    setAllAgreed(Object.values(updated).every(v => v));
  };

  const handleAllAgree = () => {
    const next = !allAgreed;
    setAllAgreed(next);
    setAgreements({ terms: next, privacy: next, aiData: next });
  };
  
  const initialInputs = {
    id: '',
    pw: '',
    confirmPw: '',
    email: '',
    authCode: '',
    nickname: ''
  };

  const [inputs, onChange, reset] = useInput(initialInputs);
  const {id, pw, confirmPw, email, authCode, nickname} = inputs;

  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({ confirmPw: '', pw: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  const toggleShowPw = () =>{
    setShowPw(!showPw);
  }

  const handleTabChange = (tabName) =>{
    setActiveTab(tabName);
    reset();
    setErrors({confirmPw: '', pw: ''}); 
  }

  useEffect(()=>{
    setIsIdChecked(false);
  },[id]);

  useEffect(()=>{
    setIsEmailVerified(false);
  },[email]);

  useEffect(()=>{
    setIsNicknameChecked(false);
  },[nickname]);

  useEffect(() => {
    if (pw.length > 0 && pw.length < 8) {
      setErrors(prev => ({ ...prev, pw: '비밀번호는 8자리 이상이어야 합니다.' }));
    } else {
      setErrors(prev => ({ ...prev, pw: '' }));
    }
  }, [pw]);

  useEffect(() => {
    if (confirmPw.length > 0) {
      if (pw !== confirmPw) {
        setErrors(prev => ({ ...prev, confirmPw: '비밀번호가 일치하지 않습니다'}));
      } else {
        setErrors(prev => ({ ...prev, confirmPw: '' }));
      }
    } else {
      setErrors(prev => ({ ...prev, confirmPw: '' }));
    }
  }, [pw, confirmPw]);

  const handleCheckId = async () => {
    if (!id) return showAlert('warning', '아이디 입력', '아이디를 입력해주세요.', 1000);
    try {
      const data = await checkIdApi(id); 
      if (data.isDuplicate) {
        showAlert('error', '중복된 아이디', '이미 사용 중인 아이디입니다', 1000);
        setIsIdChecked(false);
      }
      else {
        showAlert('success', '사용 가능', '사용 가능한 아이디입니다', 1000);
        setIsIdChecked(true);
      }
    } catch (error) {
      console.error("중복 확인 에러:", error);
      const errorMsg = error.response?.data?.message || '서버와의 연결이 원활하지 않습니다.';
      showAlert('error', '확인 실패', errorMsg, 1000);
    }
  };

  const handleCheckNickname = async () => {
    if (!nickname) return showAlert('warning', '닉네임 입력', '닉네임을 입력해주세요.', 1000);
    try {
      const data = await checkNicknameApi(nickname);
      if (data.isDuplicate) showAlert('error', '중복된 닉네임', '이미 존재하는 닉네임입니다.', 1000);
      else if(!data.isDuplicate){
        showAlert('success', '사용가능한 닉네임', '사용 가능한 닉네임입니다.', 1000);
        setIsNicknameChecked(true);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || '서버 확인 불가';
      showAlert('error', '오류 발생', errorMsg, 1000);
    }
  };

  const handleSendEmailCode = async () =>{
    if (isLoading) return;
    if(!email) {
      return showAlert('warning', '이메일 입력', '이메일 주소를 입력하세요.', 1000);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)){
      return showAlert('warning', '형식 오류', '올바른 이메일 형식이 아닙니다.', 1000);
    }
    try{
      setIsLoading(true);
      await sendEmailCodeApi(email);
      showAlert('success', '전송 완료', '인증코드가 메일로 발송되었습니다. 확인해주세요.', 1000);
    }
    catch (error){
      console.error(error);
      const errorMsg = error.response?.data?.message || '메일 발송 중 오류가 발생했습니다.';
      showAlert('error', '전송 실패', errorMsg, 1000);
    }
    finally{
      setIsLoading(false);
    }
  }

  const handleVerifyCode = async () => {
    if (isLoading) return;
    if(!authCode) {
      return showAlert('warning',  '코드 입력', '인증코드를 입력해주세요', 1000);
    }
    try {
      setIsLoading(true);
      const data = await verifyEmailCodeApi(email, authCode);
      if(data && (data.verified || data.success || (data.result && data.result.verified))) { 
          showAlert('success', '인증 성공', '이메일 인증이 완료되었습니다.', 1000);
          setIsEmailVerified(true);
      }
      else{
        showAlert('error', '인증 실패', '인증코드가 일치하지 않습니다.', 1000);
      }
    }
    catch (error){
      console.error(error);
      const errorMsg = error.response?.data?.message || '인증 확인 중 문제가 발생했습니다.';
      showAlert('error', '인증 오류', errorMsg, 1000);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === 'signin') {
      setIsLoading(true);
      try {
        const response = await loginApi({
          id: id,
          pw: pw
        });

        const userData = response.user || response.data?.user;

        if (userData) {
          // [수정] 다른 페이지에서 본인 확인이 가능하도록 로컬 스토리지에 유저 정보 저장
          localStorage.setItem('user', JSON.stringify(userData));
          
          login(userData);

          const nickname = userData.nickname || '사용자';
          await showAlert('success', '로그인 성공!', `${nickname}님 환영합니다!`, 1500);
          navigate('/profile'); 
          
        } else {
          showAlert('error', '로그인 실패', '회원 정보를 불러올 수 없습니다.', 1000);
        }
      } catch (err) {
        console.error("로그인 에러 발생:", err);
        const errorMsg = err.response?.data?.message || '아이디 또는 비밀번호가 틀렸습니다.';
        showAlert('error', '로그인 실패', errorMsg, 1000);
      } finally {
        setIsLoading(false);
      }
    } 
    else {
      if (!id || !pw || !confirmPw || !email || !authCode || !nickname) {
        return showAlert('warning', '입력 부족', '모든 정보를 입력해주세요.', 1000);
      }
      if (pw.length < 8) return showAlert('warning', '비밀번호 오류', '비밀번호는 8자리 이상이어야 합니다.', 1000);
      if (!isIdChecked) return showAlert('warning', '중복 확인', '아이디 중복 확인을 해주세요.', 1000);
      if (!isEmailVerified) return showAlert('warning', '인증 필요', '이메일 인증을 완료해주세요.', 1000);
      if (!isNicknameChecked) return showAlert('warning', '중복 확인', '닉네임 중복 확인을 해주세요.', 1000);
      if (!agreements.terms || !agreements.privacy) {
        return showAlert('warning', '약관 동의', '필수 약관에 동의해주세요.', 1000);
      }

      if (pw !== confirmPw) {
        return showAlert('error', '비밀번호 불일치', '비밀번호가 서로 다릅니다.');
      }

      setIsLoading(true);
      try {
        const signupData = {
          loginId: id,
          password: pw,
          email: email,
          nickname: nickname
        };

        await signupApi(signupData);
        await showAlert('success', '회원가입 완료!', '이제 로그인을 진행해주세요.', 1000);
        handleTabChange('signin');

      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
        showAlert('error', '가입 실패', msg, 1000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = `${SERVER_URL}/api/user/auth/kakao/callback`;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  };

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${SERVER_URL}/api/user/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email profile`;
  };

  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${SERVER_URL}/api/user/auth/naver/callback`;
    const state = Math.random().toString(36).substring(2);
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${state}`;
  };

  const handleGithubLogin = () => {
    const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-select">
          <span className={activeTab === 'signin' ? 'active-tab' : 'inactive-tab'}
          onClick={()=>handleTabChange('signin')}>Sign In</span>
          <span className={activeTab === 'signup' ? 'active-tab' : 'inactive-tab'}
          onClick={()=>handleTabChange('signup')}>Sign Up</span>
        </div>

        {activeTab === 'signin' && (
          <div className="input-group">
            <input type="text" name="id" placeholder='아이디' value={id} onChange={onChange} />
            <input type="password" name="pw" placeholder='비밀번호' value={pw} onChange={onChange} />
            <button className='signin-btn' type='submit' disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
            <div className="social-login">
              <button type="button" className="kakao-btn" onClick={handleKakaoLogin}><RiKakaoTalkFill /></button>
              <button type="button" className="google-btn" onClick={handleGoogleLogin}><FcGoogle /></button>
              <button type="button" className="naver-btn" onClick={handleNaverLogin}><SiNaver /></button>
              <button type="button" className="github-btn" onClick={handleGithubLogin}><FaGithub /></button>
            </div>
          </div>
        )}
        
        {activeTab === 'signup' && (
          <div className="signup-container">
            <div className="input-with-btn">
              <input type="text" name="id" placeholder='아이디' value={id} onChange={onChange} />
              <button type="button" className="check-btn" onClick={handleCheckId}>중복확인</button>
            </div>
            
            <div className="input-wrapper">
              <div className="password-wrapper">
                <input 
                  className={`full-input ${errors.pw ? 'input-error' : ''}`} 
                  type={showPw ? "text" : "password"} 
                  name="pw" 
                  placeholder='비밀번호' 
                  value={pw} 
                  onChange={onChange} 
                />
                <span onClick={toggleShowPw} className='eye-icon'>{showPw ? <FaEyeSlash /> : <FaEye />}</span>
              </div>
              {errors.pw && <span className="error-text">{errors.pw}</span>}
            </div>

            <div className='input-wrapper'>
              <input className={`full-input ${errors.confirmPw ? 'input-error' : ''}`} type="password" name="confirmPw" placeholder='비밀번호 재확인' value={confirmPw} onChange={onChange} />
              {errors.confirmPw && <span className="error-text">{errors.confirmPw}</span>}
            </div>
            <div className="input-with-btn">
              <input type="email" name="email" placeholder='이메일' value={email} onChange={onChange} />
              <button type="button" className="check-btn" onClick={handleSendEmailCode} disabled={isLoading}>
                {isLoading ? '전송중' : '코드발송'}
              </button>
            </div>
            <div className="input-with-btn">
              <input type="text" name="authCode" placeholder='인증코드 입력' value={authCode} onChange={onChange} />
              <button type="button" className="check-btn" onClick={handleVerifyCode} disabled={isLoading}>
                {isLoading ? '확인중' : '인증하기'}
              </button>
            </div>
            <div className="input-with-btn">
              <input type="text" name="nickname" placeholder='닉네임' value={nickname} onChange={onChange} />
              <button type="button" className="check-btn" onClick={handleCheckNickname}>중복확인</button>
            </div>
            <Agreement
            agreements={agreements}
            allAgreed={allAgreed}
            onAgreement={handleAgreement}
            onAllAgree={handleAllAgree}
            />
            <button className='signup-btn' type='submit' disabled={isLoading}>
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
export default Login