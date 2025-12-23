import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { RiKakaoTalkFill } from "react-icons/ri";
import { FaGoogle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";
import { SiNaver } from "react-icons/si";
import './Login.css'

function Login() {
const [inputs, setInputs] = useState({
  id: '',
  pw: ''
})
const{id,pw} = inputs;
const onChange = (e) =>{
  const {name, value} = e.target;
  setInputs({
    ...inputs,
    [name]: value
  });
};
const navigate = useNavigate();

const handleLogin = (e) => {
  e.preventDefault();
  console.log('ID:', inputs.id);
  console.log('PW:', inputs.pw);
if(inputs.id === 'jss229510' && inputs.pw === 'thwntjd123'){
  navigate('/menu');
}
else{
  alert("로그인 실패하셨습니다.");
}
}
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
       <h1 className="login-title">Login</h1>
        <div className="input-group">
  <label>ID</label>
  <input 
    type='text' name='id' placeholder='아이디를 입력하세요' className='login-input'
    value ={id}
    onChange={onChange}
    />
</div>
          <div className="input-group">
  <label>Password</label>
  <input type='password' name='pw'placeholder='비밀번호를 입력하세요' className='login-input'
  value ={pw}
  onChange={onChange}
  />
</div>
        <button type="submit" className='login-btn'>
        로그인
        </button>
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