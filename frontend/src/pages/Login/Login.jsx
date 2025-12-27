import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import './Login.css'
import { checkIdApi, checkNicknameApi, signupApi, loginApi, sendEmailCodeApi, verifyEmailCodeApi } from '../../api/auth';
import Swal from "sweetalert2";

function Login() {
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const initialInputs = {
    id: '',
    pw: '',
    confirmPw: '',
    email: '',
    authCode: '',
    nickname: ''
  };

  const [inputs, setInputs] = useState(initialInputs);
  const {id, pw, confirmPw, email, authCode, nickname} = inputs;
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({ confirmPw: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  const toggleShowPw = () =>{
    setShowPw(!showPw);
  }

  const handleTabChange = (tabName) =>{
    setActiveTab(tabName);
    setInputs(initialInputs);
    setErrors({confirmPw: ''});
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: value
    });
    if (name === 'id') setIsIdChecked(false);
    if (name === 'email') setIsEmailVerified(false);
    if (name === 'nickname') setIsNicknameChecked(false);
  };

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

  const showAlert = (icon, title, text) => {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonColor: '#26A69A',
    });
  };

  const handleCheckId = async () => {
    if (!id) return showAlert('warning', '아이디 입력', '아이디를 입력해주세요.');

    try {
      const data = await checkIdApi(id); 
      if (data.isDuplicate) {
        showAlert('error', '중복된 아이디', '이미 사용 중인 아이디입니다');
        setIsIdChecked(false);
      }
      else {
        showAlert('success', '사용 가능', '사용 가능한 아이디입니다');
        setIsIdChecked(true);
      }
    } catch (error) {
      console.error("중복 확인 에러:", error);
      showAlert('error', '오류 발생', '서버 연결 실패');
    }
  };

  const handleCheckNickname = async () => {
    if (!nickname) return showAlert('warning', '닉네임 입력', '닉네임을 입력해주세요.');
    try {
      const data = await checkNicknameApi(nickname);
      if (data.isDuplicate) showAlert('error', '중복된 닉네임', '이미 존재하는 닉네임입니다.');
      else if(!data.isDuplicate){
        showAlert('success', '사용가능한 닉네임', '사용 가능한 닉네임입니다.');
        setIsNicknameChecked(true);
      }
    } catch (error) {
      console.error(error);
      showAlert('error', '오류 발생', '서버 확인 불가');
    }
  };

  const handleSendEmailCode = async () =>{
    if (isLoading) return;

    if(!email) {
      return showAlert('warning', '이메일 입력', '이메일 주소를 입력하세요.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)){
      return showAlert('warning', '형식 오류', '올바른 이메일 형식이 아닙니다.');
    }

    try{
      setIsLoading(true);
      await sendEmailCodeApi(email);
      showAlert('success', '전송 완료', '인증코드가 메일로 발송되었습니다. 확인해주세요.');
    }
    catch (error){
      console.error(error);
      showAlert('error', '전송 실패', '메일 발송 중 오류가 발생했습니다.');
    }
    finally{
      setIsLoading(false);
    }
  }

  const handleVerifyCode = async () => {
    if (isLoading) return;

    if(!authCode) {
      return showAlert('warning',  '코드 입력', '인증코드를 입력해주세요');
    }
    try {
      setIsLoading(true);
      
      const data = await verifyEmailCodeApi(email, authCode);
      
      // [디버깅] F12 콘솔에서 서버가 보낸 데이터를 직접 확인해보세요!
      console.log("서버 응답 데이터:", data); 

      // 백엔드 응답 구조의 모든 가능성을 체크 (안전장치)
      if(data && (data.verified || data.success || (data.result && data.result.verified))) { 
          showAlert('success', '인증 성공', '이메일 인증이 완료되었습니다.');
          setIsEmailVerified(true);
      }
      else{
        showAlert('error', '인증 실패', '인증코드가 일치하지 않습니다.');
      }
    }
    catch (error){
      console.error(error);
      showAlert('error', '오류', '인증 확인 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }
//로그인
  const handleLogin = async (e) => {
  e.preventDefault();
  if(isLoading) return;

  if(activeTab === 'signin'){
    setIsLoading(true);
    try {
      const response = await loginApi({
        id: id,
        pw: pw
      }); 


      // 데이터 안에 'user' 정보가 있거나, 응답 자체가 성공적이면 통과시킴
      if (response && (response.user || response.data?.user || response.status === 200)) {
        
        const userData = response.user || response.data?.user;
        if (userData) login(userData);
        // 백엔드에서 보낸 닉네임 위치에 맞춰 수정
        const nickname = response.user?.nickname || response.data?.user?.nickname || '사용자';

        Swal.fire({
          icon: 'success',
          title: '로그인 성공!',
          text: `${nickname}님 환영합니다!`
        }).then(() => {
          navigate('/menu'); // 메인 메뉴로 이동
        });
      } else {
        // 백엔드가 200을 줬지만 데이터 형식이 이상한 경우
        showAlert('error', '로그인 실패', '응답 형식이 올바르지 않습니다.');
      }
    } catch(err) {
      console.error("로그인 에러 발생:", err);
      // 백엔드에서 401(비번 틀림)을 보내면 catch문으로 들어오게됨
      const errorMsg = err.response?.data?.message || '아이디 또는 비밀번호가 틀렸습니다.';
      showAlert('error', '로그인 실패', errorMsg);
    } finally {
      setIsLoading(false);
    }

    } else {
      // === 회원가입 로직 ===
      if(!id || !pw || !confirmPw || !email || !authCode || !nickname){
        return showAlert('warning', '입력 부족', '모든 정보를 입력해주세요.');
      }
      if (!isIdChecked) return showAlert('warning', '중복 확인', '아이디 중복 확인을 해주세요.');
      if (!isEmailVerified) return showAlert('warning', '인증 필요', '이메일 인증을 완료해주세요.');
      if (!isNicknameChecked) return showAlert('warning', '중복 확인', '닉네임 중복 확인을 해주세요.');

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
        
        Swal.fire({
          icon: 'success',
          title: '회원가입 완료!',
          text: '이제 로그인을 진행해주세요.',
          confirmButtonColor: '#26A69A'
        }).then(() => {
          handleTabChange('signin');
        });
        
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
        showAlert('error', '가입 실패', msg);
      } finally {
        setIsLoading(false);
      }
    }
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
          </div>
        )}
        
    {activeTab === 'signup' && (
          <div className="signup-container">
            <div className="input-with-btn">
              <input type="text" name="id" placeholder='아이디' value={id} onChange={onChange} />
              <button type="button" className="check-btn" onClick={handleCheckId}>중복확인</button>
            </div>
            <div className="password-wrapper">
            <input className="full-input" type={showPw ? "text" : "password"} name="pw" placeholder='비밀번호' value={pw} onChange={onChange} />
            <span onClick={toggleShowPw} className='eye-icon'>{showPw ? <FaEyeSlash /> : <FaEye />}</span></div>
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