import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { RiKakaoTalkFill } from "react-icons/ri";
import { FaGoogle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";
import { SiNaver } from "react-icons/si";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import './Login.css'
import { checkIdApi, checkNicknameApi, signupApi } from '../../api/auth';
import Swal from "sweetalert2";

function Login() {
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
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
  const [showpw, setShowpw] = useState(false);
  const [errors, setErrors] = useState({ confirmPw: '' });
  const [isLoading, setIsLoading] = useState(false);

  const toggleShowPw = () =>{
    setShowpw(!showpw);
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
  };

  useEffect(() => {
    // 비밀번호 확인칸에 뭔가 적혀있을 때만 검사
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
      confirmButtonColor: '#26A69A', // 우리 테마색 (초록)
    });
  };

  const handleCheckId = async () => {
    if (!id) return showAlert('warning', '아이디 입력', '아이디를 입력해주세요.');

    try {
      const data = await checkIdApi(id); 
      if (data.isDuplicate) showAlert('error', '중복된 아이디', '이미 사용 중인 아이디입니다');
      else showAlert('success', '사용 가능', '사용 가능한 아이디입니다');
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
      else showAlert('success', '멋진 닉네임!', '사용 가능한 닉네임입니다.');
    } catch (error) {
      console.error(error);
      showAlert('error', '오류 발생', '서버 확인 불가');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if(isLoading) return;

    if(activeTab === 'signin'){
      // === 로그인 로직 ===
      setIsLoading(true);
      try{
        await new Promise(r => setTimeout(r, 1000));
      
        if (id === 'jss229510' && pw === 'thwntjd123') {
          Swal.fire({
            icon: 'success',
            title: '로그인 성공!',
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            navigate('/menu');
          });
        } else {
          showAlert('error', '로그인 실패', '아이디 또는 비밀번호가 틀렸습니다.');
        }
      } catch(err){
        console.error("로그인 에러 발생:", err);
        showAlert('error', '오류', '로그인 중 오류가 발생했습니다.');
      } finally{
        setIsLoading(false);
      }

      

    } else {
      // === 회원가입 로직 ===
      if(!id || !pw || !confirmPw || !email || !authCode || !nickname){
        return showAlert('warning', '입력 부족', '모든 정보를 입력해주세요.');
      }
      if (pw !== confirmPw) {
        return showAlert('error', '비밀번호 불일치', '비밀번호가 서로 다릅니다.');
      }

      setIsLoading(true);
      try {
        await signupApi(inputs);
        console.log(inputs);
        await new Promise(r => setTimeout(r, 1000)); 
        
        showAlert('success', '회원가입 완료!', '이제 로그인을 진행해주세요.');
        handleTabChange('signin');
        
      } catch (err) {
        console.error(err);
        showAlert('error', '가입 실패', '회원가입 중 오류가 발생했습니다.');
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
            <input className="full-input" type={showpw ? "text" : "password"} name="pw" placeholder='비밀번호' value={pw} onChange={onChange} />
            <span onClick={toggleShowPw} className='eye-icon'>{showpw ? <FaEyeSlash /> : <FaEye />}</span></div>
            <div className='input-wrapper'>
              <input className={`full-input ${errors.confirmPw ? 'input-error' : ''}`} type="password" name="confirmPw" placeholder='비밀번호 재확인' value={confirmPw} onChange={onChange} />
              {errors.confirmPw && <span className="error-text">{errors.confirmPw}</span>}
            </div>
            <div className="input-with-btn">
              <input type="email" name="email" placeholder='이메일' value={email} onChange={onChange} />
              <button type="button" className="check-btn">코드발송</button>
            </div>
            <div className="input-with-btn">
              <input type="text" name="authCode" placeholder='인증코드 입력' value={authCode} onChange={onChange} />
              <button type="button" className="check-btn">인증하기</button>
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
        <div className="login-icons">  
          <RiKakaoTalkFill size={32} />
          <FaGoogle size={30} color='red'/>
          <FaGithub size={30} />
          <SiNaver size={28} color='green' />
        </div>
      </form>
    </div>
  )
}
export default Login