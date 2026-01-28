import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import './Chat.css';
import axios from '../../api/axios'; // 백엔드 API 호출을 위한 설정된 axios 인스턴스
import { FaPlus, FaHistory, FaPaperPlane, FaRobot, FaUser, FaTimes } from "react-icons/fa";
import Typewriter from './Typewriter';

function Chat() {
  const location = useLocation();

  // 사이드바 토글 상태 및 이전 페이지(Main)에서 전달받은 식물 데이터 (없으면 기본값 사용)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const plant = location.state?.plant || { plant_name: '반려식물' };

  // 채팅 UI 상태 관리: 메시지 리스트, 입력값, 로딩중 표시, 이미지 미리보기
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectImage, setSelectImage] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  
  // DOM 직접 제어를 위한 Ref 설정
  const messagesEndRef = useRef(null); // 새 메시지 도착 시 스크롤 하단 이동용
  const fileInputRef = useRef(null);   // 숨겨진 input[type="file"]을 버튼으로 제어하기 위함
  const textareaRef = useRef(null);    // 입력 텍스트 양에 따라 높이를 자동 조절하기 위함

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  const handleNewChat = () => {
      setMessages([]); //회면 초기화 (메세지, 이미지, 텍스트, 사이드바 오픈된거까지 닫기)
      setSelectImage(null);
      setInputText('');
      setIsSidebarOpen(false);
    };

    const handleSelectChat = (log) => {
      setMessages([]);

      const confidenceScore = log.confidence 
        ? Math.round(log.confidence * 100) 
        : 0;
      
      let confidenceText = `(정확도: ${confidenceScore}%)`;
      if (confidenceScore < 50) {
        confidenceText += '결과가 불확실할 수 있습니다.';
      }

      const pastUserMessage ={
        id: `user-${log.id}`,
        text: log.question,
        image: log.image,
        sender: 'user',
        timestamp: log.date
      };

      const pastAiMessage = {
        id: `ai-${log.id}`,
        text: `[진단 결과: ${log.answer}]\n ${confidenceText}\n\n  조치사항: \n${log.recommendation}`,
        sender: 'ai',
        timestamp: log.date
      };

      setMessages([pastUserMessage, pastAiMessage]);
      setIsSidebarOpen(false);
    }

    const fetchChatHistory = async () => { //진단기록 api로 받아오는 코드
      try{
        const res = await axios.get(`/api/diagnosis-logs/${plant.id}`);
        const serverlogs = res.data.logs || res.data || [];
        
        serverlogs.sort((a, b) => {
      const dateA = new Date(a.diagnosis_date || a.created_at);
      const dateB = new Date(b.diagnosis_date || b.created_at);
      return dateB - dateA; 
    });

        if (!Array.isArray(serverlogs)) {
      console.error("데이터 형식이 올바르지 않습니다:", serverlogs);
      setChatHistory([]); // 빈 배열로 설정해서 에러 방지
      return;
    }

        const formattedLogs = serverlogs.map(log => {
          let displayTitle = '새로운 상담';
          
          if(log.result && log.result !== '상담' && log.result !== '통신 오류' && log.result !== '정상'){
            displayTitle = log.result;
          }

          else if(log.question){
            displayTitle = log.question.length > 5
            ? log.question.substring(0, 10) + '...'
            : log.question;
          }

          return{
          id: log.id,  //db에서 상담 했던 id
          title: displayTitle,  //상담한 내용 타이틀
          date: (log.diagnosis_date || log.created_at || '').slice(0, 10), //상담 날짜
          question: log.question,
          answer: log.result,
          recommendation: log.recommendation,
          image: log.image_url,
          confidence: log.confidence
          };
        });
        setChatHistory(formattedLogs);
      } catch(error){
        console.error('기록 불러오기 실패', error);
      }
    };

  const suggestions = [
    "잎이 갈색으로 변해요",
    "물은 언제 줘야 하나요?",
    "햇빛이 부족한 것 같아요",
    "벌레가 생긴 것 같아요"
  ];

  // 메시지 목록이 업데이트되거나 로딩 상태가 변할 때마다 스크롤을 최하단으로 이동 (UX 편의성)
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 사용자가 텍스트를 입력할 때마다 textarea의 높이를 내용에 맞춰 자동으로 늘림 (UI 개선)
  useEffect(() => {
    if(textareaRef.current){
      textareaRef.current.style.height = 'auto'; // 높이를 초기화해야 줄어들 때도 반응함
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // 내용 높이만큼 설정
    }
  }, [inputText]);

  useEffect(() => {
    if(plant.id){
      fetchChatHistory();
    }
  }, [plant.id]);

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if(file) {
      // 파일을 브라우저에서 즉시 볼 수 있도록 임시 URL(Blob) 생성
      const imageUrl = URL.createObjectURL(file);
      setSelectImage({file: file, preview: imageUrl});

      // 중요: input value를 비워줘야 동일한 파일을 다시 선택했을 때도 onChange가 발동됨
      if(fileInputRef.current){
        fileInputRef.current.value = '';
      }
    }
  };

  // 메시지 전송 및 백엔드 진단 요청 처리 (핵심 로직)
  const handleSendMessage = async (textOverride) => {
    // 추천 버튼 클릭 시 인자값 사용, 아니면 입력창(inputText) 값 사용
    const textToSend = (typeof textOverride === 'string' ? textOverride : inputText);
    
    // 유효성 검사: 텍스트와 이미지 둘 다 없으면 전송 중단
    if (!textToSend.trim() && !selectImage) return;

    // 1. [Optimistic UI] 서버 응답을 기다리지 않고 사용자 메시지를 먼저 화면에 표시
    const userMessage = {
      id: Date.now(),
      text: textToSend,
      image: selectImage ? selectImage.preview : null,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // 입력창 초기화 및 로딩 상태 활성화
    setInputText('');
    setSelectImage(null);
    setIsLoading(true);

    // 전송 후 textarea 높이 초기화 (1줄로 복귀)
    if(textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // 2. 파일 업로드를 위해 FormData 객체 생성 (JSON이 아닌 multipart/form-data 형식 필요)
      const formData = new FormData();

      // 백엔드 라우터(router.js)의 upload.single('image') 설정과 키 이름을 일치시켜야 함
      if(selectImage?.file){
        formData.append('image', selectImage.file);
      }

      // 백엔드 모델의 request body 구조에 맞춰 텍스트 데이터 추가
      formData.append('question', textToSend);

      // 3. 백엔드 API로 진단 요청 전송 (POST /api/diagnosis-logs/:plantId)
      const response = await axios.post(`/api/diagnosis-logs/${plant.id}`, formData, {
        headers: {
          'Content-Type' :'multipart/form-data', // 파일 전송 시 필수 헤더
        },
      });

      // 4. 서버로부터 분석 결과 수신 및 AI 메시지 생성
      const serverData = response.data.data; // { result, recommendation ... }

      const confidenceScore = serverData.confidence
      ? Math.round(serverData.confidence * 100)
      : 0;

      let confidenceText = `(정확도: ${confidenceScore}%)`;

      if (confidenceScore < 50){
        confidenceText += '결과가 불확실할 수 있습니다.';
      }

      const aiMessage = {
        id: Date.now() + 1,
        // 서버 응답값(진단명, 조치사항)을 포맷팅하여 표시
        text: `[진단결과: ${serverData.result|| '분석중'}]\n ${confidenceText}\n\n 조치사항: \n${serverData.recommendation || '특별한 조치사항이 없습니다.'}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      fetchChatHistory();

    } catch (error) {
      console.error('진단 요청 실패:', error);

      // 에러 발생 시 사용자에게 안내 메시지 출력 (앱이 멈추지 않도록 처리)
      const errorMessage = {
        id: Date.now() + 2,
        text: "진단 서버와 연결할 수 없습니다. 잠시 후 다시 시도 해주세요.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // 성공하든 실패하든 로딩 상태 해제
    }
  };
  
  // 엔터키 입력 핸들러 (Shift + Enter는 줄바꿈 허용, 그냥 Enter는 전송)
  const handleKeyDown = (e) => {
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault(); // 기본 줄바꿈 방지
      handleSendMessage();
    }
  }

  return (
    <div className="chat-container">
      {/* 기록 보기 사이드바 컴포넌트 */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        chats={chatHistory} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
      
      {/* 사이드바 활성화 시 배경 딤(Dim) 처리 */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="chat-view">
        {/* 상단 툴바: 기록 보기 버튼 */}
        <div className="chat-header-toolbar">
          <button 
            className="history-toggle-btn" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <FaHistory /> <span className="btn-text">기록 보기</span>
          </button>
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="content-width full-height-content">
          {messages.length === 0 ? (
            // 메시지가 없을 때 보여줄 초기 가이드 화면
            <div className="empty-state">
              <div className="ai-logo">🌱</div> 
              <h2>안녕하세요, {plant.plant_name} 진단 AI입니다.</h2>
              <p>식물 사진을 올리거나, 궁금한 증상을 물어보세요.</p>
              
              {/* 추천 질문 카드 리스트 */}
              <div className="suggestion-grid">
                {suggestions.map((text, index) => (
                  <button 
                    key={index} 
                    className="suggestion-card"
                    onClick={() => handleSendMessage(text)} 
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 주고받은 메시지 목록 렌더링
            <div className="message-list-area">
              {messages.map((msg, index) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>
                  {msg.sender === 'ai' && <div className="message-avatar"><FaRobot /></div>}
                  
                  <div className="message-bubble">
                    {/* 이미지가 포함된 메시지일 경우 이미지 렌더링 */}
                    {/* 텍스트 줄바꿈(\n) 처리하여 렌더링 */}
                    {msg.image &&(
                      <img src = {msg.image} alt='전송된 사진' className='message-image'/>
                    )}
                    {msg.sender === 'ai' && index === messages.length -1 ? (
                      <Typewriter text = {msg.text} speed ={30} onUpdate={scrollToBottom}/>
                    ) : (
                    msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i !== msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))
                    )}
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                  {msg.sender === 'user' && <div className="message-avatar user"><FaUser /></div>}
                </div>
              ))}
              
              {/* 로딩 중(답변 생성 중) 표시 */}
              {isLoading && (
                <div className="message-row ai">
                  <div className="message-avatar"><FaRobot /></div>
                  <div className="message-bubble loading">
                    <div className="dot-flashing"></div>
                  </div>
                </div>
              )}
              {/* 자동 스크롤을 위한 타겟 요소 */}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          <div className="bottom-spacer"></div>
        </div>
      </div> 

      {/* 하단 입력바 영역 */}
      <div className="input-section">
        <div className="content-width">
          <div className="input-box">
            {/* 선택된 이미지가 있을 때 입력창 내부에 미리보기 표시 */}
            {selectImage && (
                <div className="inner-image-preview">
                    <img src={selectImage.preview} alt='미리보기'/>
                    <button onClick={() => setSelectImage(null)}>
                        <FaTimes/>
                    </button>
                </div>
            )}
            <div className="input-row">
                {/* 커스텀 버튼 연결을 위해 실제 input은 숨김 처리 */}
                <input 
                    type="file"
                    accept='image/*'
                    ref={fileInputRef}
                    style={{display:'none'}}
                    onChange={handleImageSelect}
                />
                <button className='icon-btn' onClick={() => fileInputRef.current.click()}>
                    <FaPlus />
                </button>
                <textarea
                    ref={textareaRef}
                    placeholder={`${plant.plant_name}에 대해 물어보세요.`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <button className='send-btn' onClick={() => handleSendMessage()}>
                    <FaPaperPlane />
                </button>
            </div>
          </div>
          <p className='disclaimer'>AI는 실수를 할 수 있습니다. 정확한 정보는 전문가와 상담하세요.</p>
        </div>
      </div>
    </div>
  );
}

export default Chat;