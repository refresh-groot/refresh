import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import './Chat.css';
import axios from '../../api/axios';
import { FaPlus, FaHistory, FaPaperPlane, FaRobot, FaUser, FaTimes } from "react-icons/fa";
import Typewriter from './Typewriter';

/**
 * 고유한 세션 ID를 생성하는 함수
 * - 형식: "session_" + 현재 타임스탬프 + "_" + 랜덤 문자열
 * - 새 대화를 시작할 때마다 호출되어, 서버에서 대화를 구분하는 키로 사용됨
 * - 예: "session_1707632400000_k3f9x2a"
 */
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Chat 컴포넌트
 * - 식물 AI 진단 채팅 메인 화면
 * - 사이드바(대화 기록) + 채팅 뷰(메시지 목록) + 하단 입력 영역으로 구성
 * - 이전 페이지에서 react-router의 location.state로 선택한 식물 정보를 받아옴
 */
function Chat() {
  // react-router의 location.state에서 식물 정보를 가져옴
  // 전달된 값이 없으면 기본값(id=0, 이름='반려식물') 사용
  const location = useLocation();
  const plant = location.state?.plant || { id: 0, plant_name: '반려식물' };

  // ─── UI 상태 ───────────────────────────────────────────────────────────────

  // 사이드바(기록 패널)가 열려있는지 여부
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 채팅창에 표시되는 메시지 배열
  // 각 항목 형태: { id, text, image, sender('user'|'ai'), timestamp, isNew }
  const [messages, setMessages] = useState([]);

  // 하단 입력창의 텍스트 값
  const [inputText, setInputText] = useState('');

  // AI 응답을 기다리는 중인지 여부 (true이면 로딩 애니메이션 표시)
  const [isLoading, setIsLoading] = useState(false);

  // 사용자가 선택한 이미지: { file: File 객체, preview: 로컬 미리보기 URL } 또는 null
  const [selectImage, setSelectImage] = useState(null);

  // ─── 사이드바 / 세션 상태 ──────────────────────────────────────────────────

  // 사이드바에 표시될 대화 기록 목록 (서버에서 불러온 데이터)
  const [chatHistory, setChatHistory] = useState([]);

  // 현재 진행 중인 대화의 세션 ID
  // 메시지 전송 시 서버에 함께 보내 같은 대화 스레드에 기록되도록 함
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // ─── DOM 참조 ──────────────────────────────────────────────────────────────

  // 메시지 목록 최하단 요소 참조 — 새 메시지 도착 시 여기로 스크롤
  const messagesEndRef = useRef(null);

  // 숨겨진 파일 입력 요소 참조 — 이미지 첨부 버튼 클릭 시 .click() 호출
  const fileInputRef = useRef(null);

  // 입력 textarea 참조 — 내용 길이에 따라 높이를 동적으로 조절하기 위해 사용
  const textareaRef = useRef(null);

  /**
   * 메시지 목록을 맨 아래로 부드럽게 스크롤하는 함수
   * - 새 메시지가 추가되거나 AI 응답이 오면 자동 호출됨
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── 초기화: 컴포넌트 첫 마운트 시 (plant.id가 있을 때만 실행) ─────────────
  useEffect(() => {
    if (plant.id) {
      fetchChatHistory().then((history) => {
        if (history && history.length > 0 && !currentSessionId) {
          // 저장된 기록이 있으면 가장 최근 대화를 자동으로 불러옴
          const latestSession = history[0];
          handleSelectChat(latestSession);
        } else if (!currentSessionId) {
          // 기록이 없으면 새 세션 ID를 발급해 빈 화면으로 시작
          setCurrentSessionId(generateSessionId());
        }
      });
    }
  }, [plant.id]);

  // messages 배열 또는 isLoading 상태가 바뀔 때마다 스크롤을 맨 아래로 내림
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // inputText가 바뀔 때마다 textarea 높이를 내용에 맞게 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';                                   // 일단 초기화
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // 실제 내용 높이로 확장
    }
  }, [inputText]);

  /**
   * 새 대화 시작 핸들러
   * - 현재 메시지 목록·이미지·입력값을 모두 초기화
   * - 새 세션 ID를 발급해 서버에 새 대화 스레드로 인식되도록 함
   * - 사이드바를 닫음
   */
  const handleNewChat = () => {
    setMessages([]);
    setSelectImage(null);
    setInputText('');
    setIsSidebarOpen(false);
    setCurrentSessionId(generateSessionId());
  };

  /**
   * 사이드바에서 특정 대화 기록 항목을 클릭했을 때 호출되는 핸들러
   * - 서버에서 받아온 로그 배열을 화면에 표시할 말풍선 형태로 변환
   * - 사용자 메시지(question)와 AI 응답(result + recommendation)을 각각 생성
   * - 해당 대화의 세션 ID로 currentSessionId를 교체해 이어쓰기가 가능하게 함
   *
   * @param {object} sessionData - 사이드바 목록의 대화 항목 데이터 (logs 배열 포함)
   */
  const handleSelectChat = (sessionData) => {
    const sessionLogs = sessionData.logs || [];

    // 시간 오름차순(오래된 것 → 최신) 정렬
    sessionLogs.sort((a, b) =>
      new Date(a.created_at || a.diagnosis_date) - new Date(b.created_at || b.diagnosis_date)
    );

    const convertedMessages = [];
    sessionLogs.forEach(log => {
      // 사용자 질문이 있으면 user 말풍선 추가
      if (log.question) {
        convertedMessages.push({
          id: `user-${log.id}`,
          text: log.question,
          image: log.image_url,                               // 당시 첨부 이미지 URL
          sender: 'user',
          timestamp: (log.diagnosis_date || '').slice(11, 16), // "HH:MM" 형식
          isNew: false                                        // 과거 메시지 → 타이핑 애니메이션 없음
        });
      }

      // AI 진단 결과가 있으면 ai 말풍선 추가
      if (log.result) {
        const confidenceScore = log.confidence ? Math.round(log.confidence * 100) : 0;
        let confidenceText = `(정확도: ${confidenceScore}%)`;
        if (confidenceScore < 50) confidenceText += ' 결과가 불확실할 수 있습니다.';

        convertedMessages.push({
          id: `ai-${log.id}`,
          text: `[진단 결과: ${log.result}]\n${confidenceText}\n\n조치사항: \n${log.recommendation}`,
          sender: 'ai',
          timestamp: (log.diagnosis_date || '').slice(11, 16),
          isNew: false
        });
      }
    });

    setMessages(convertedMessages);

    // 선택한 대화의 세션 ID로 교체 → 이 대화에 이어서 메시지를 보낼 수 있음
    if (sessionData.raw_session_id) {
      setCurrentSessionId(sessionData.raw_session_id);
    }
    setIsSidebarOpen(false);
  };

  /**
   * 서버에서 해당 식물의 전체 대화 기록을 불러와 사이드바 목록을 구성하는 함수
   *
   * 처리 흐름:
   *   1. 서버에서 로그 배열을 받아옴
   *   2. session_id 기준으로 로그를 그룹화 (한 대화 = 한 그룹)
   *   3. 각 그룹의 제목을 결정 (사용자 지정 이름 > 첫 번째 질문 > 기본값)
   *   4. 최신 대화가 먼저 오도록 내림차순 정렬
   *   5. chatHistory 상태를 업데이트하고, 가공된 목록을 반환
   *
   * @returns {array} 가공된 대화 기록 목록
   */
  const fetchChatHistory = async () => {
    if (!plant.id) return [];
    try {
      const res = await axios.get(`/api/diagnosis-logs/${plant.id}`);
      const serverlogs = res.data.logs || res.data || [];

      if (!Array.isArray(serverlogs)) {
        setChatHistory([]);
        return [];
      }

      // ── session_id 기준으로 로그를 그룹화 ────────────────────────────────
      const grouped = {};
      serverlogs.forEach(log => {
        // session_id가 없는 레거시 로그는 id로 개별 그룹 처리
        const sKey = log.session_id || `legacy_${log.id}`;
        if (!grouped[sKey]) {
          grouped[sKey] = {
            id: sKey,
            raw_session_id: log.session_id, // 실제 세션 ID (이어쓰기에 사용)
            title: null,
            latestDate: log.diagnosis_date || log.created_at,
            logs: []
          };
        }
        grouped[sKey].logs.push(log);

        // 그룹 내 가장 최신 날짜 갱신 (목록 정렬 기준)
        const logDate = new Date(log.diagnosis_date || log.created_at);
        if (logDate > new Date(grouped[sKey].latestDate)) {
          grouped[sKey].latestDate = log.diagnosis_date || log.created_at;
        }
      });

      // ── 각 그룹의 제목 결정 ────────────────────────────────────────────────
      Object.values(grouped).forEach(group => {
        // 시간 오름차순 정렬 후 첫 번째 로그를 제목 기준으로 사용
        group.logs.sort((a, b) =>
          new Date(a.diagnosis_date || a.created_at) - new Date(b.diagnosis_date || b.created_at)
        );
        const firstLog = group.logs[0];

        // 사용자가 직접 변경한 제목이 있으면 그것을 사용
        // 없으면 첫 번째 질문을 제목으로 사용
        if (firstLog.title && firstLog.title !== '새로운 상담') {
          group.title = firstLog.title;
        } else {
          group.title = firstLog.question || '상담 기록';
        }
      });

      // ── 최신 대화가 맨 위에 오도록 내림차순 정렬 ─────────────────────────
      const historyList = Object.values(grouped).sort((a, b) =>
        new Date(b.latestDate) - new Date(a.latestDate)
      );

      // 날짜를 "YYYY-MM-DD" 형식으로 가공해 사이드바에 표시
      const finalHistory = historyList.map(item => ({
        ...item,
        date: (item.latestDate || '').slice(0, 10)
      }));

      setChatHistory(finalHistory);
      return finalHistory;

    } catch (error) {
      console.error('기록 불러오기 실패', error);
      return [];
    }
  };

  // 빈 화면(대화가 없을 때) 하단에 표시되는 빠른 질문 제안 목록
  const suggestions = [
    "잎이 갈색으로 변해요",
    "물은 언제 줘야 하나요?",
    "햇빛이 부족한 것 같아요",
    "벌레가 생긴 것 같아요"
  ];

  /**
   * 파일 입력에서 이미지를 선택했을 때 호출되는 핸들러
   * - 선택한 파일로 로컬 미리보기 URL을 만들어 상태에 저장
   * - 같은 파일을 다시 선택할 수 있도록 input value를 초기화
   */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file); // 브라우저 메모리의 임시 URL 생성
      setSelectImage({ file: file, preview: imageUrl });
      if (fileInputRef.current) fileInputRef.current.value = ''; // input 초기화
    }
  };

  /**
   * 메시지 전송 핸들러
   * - 텍스트 또는 이미지를 서버로 전송하고 AI 진단 결과를 받아옴
   *
   * @param {string} [textOverride] - 제안 카드 클릭 시 넘겨받는 텍스트
   *                                  없으면 inputText 상태 값을 사용
   *
   * 처리 흐름:
   *   1. 빈 입력 방어 (텍스트도 없고 이미지도 없으면 전송 안 함)
   *   2. 사용자 말풍선을 즉시 화면에 추가 (서버 응답 전에 먼저 보여줌)
   *   3. 입력창 초기화 + 로딩 시작
   *   4. FormData로 서버에 POST 요청 (세션 ID + 질문 텍스트 + 이미지)
   *   5. 응답 받으면 AI 말풍선 추가 + 사이드바 기록 갱신
   *   6. 오류 발생 시 에러 안내 말풍선 추가
   *   7. 성공·실패 무관하게 로딩 상태 해제 (finally)
   */
  const handleSendMessage = async (textOverride) => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : inputText);

    // 텍스트도 이미지도 없으면 전송하지 않음
    if (!textToSend.trim() && !selectImage) return;

    // 사용자 말풍선 데이터 구성
    const userMessage = {
      id: Date.now(),
      text: textToSend,
      image: selectImage ? selectImage.preview : null, // 로컬 미리보기 URL
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 서버 응답 전에 사용자 말풍선 먼저 추가 (낙관적 업데이트)
    setMessages((prev) => [...prev, userMessage]);

    setInputText('');
    setSelectImage(null);
    setIsLoading(true);

    try {
      // FormData로 멀티파트 요청 구성 (텍스트 + 이미지 동시 전송 가능)
      const formData = new FormData();
      if (currentSessionId) {
        formData.append('session_id', currentSessionId); // 같은 대화 스레드에 기록
      }
      formData.append('question', textToSend);
      if (selectImage?.file) {
        formData.append('image', selectImage.file);
      }

      const response = await axios.post(`/api/diagnosis-logs/${plant.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30초 내 응답 없으면 에러 처리
      });

      // 서버 응답 데이터에서 진단 결과 파싱
      const serverData = response.data.data || response.data;
      const confidenceScore = serverData.confidence ? Math.round(serverData.confidence * 100) : 0;
      let confidenceText = `(정확도: ${confidenceScore}%)`;
      if (confidenceScore < 50) confidenceText += ' 결과가 불확실할 수 있습니다.';

      // AI 말풍선 데이터 구성
      const aiMessage = {
        id: Date.now() + 1,
        text: `[진단결과: ${serverData.result || '분석중'}]\n${confidenceText}\n\n조치사항: \n${serverData.recommendation || '특별한 조치사항이 없습니다.'}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNew: true, // 새로 받은 응답 → 타이핑 애니메이션 적용
      };

      setMessages((prev) => [...prev, aiMessage]);
      fetchChatHistory(); // 사이드바 기록 목록을 최신 상태로 갱신

    } catch (error) {
      console.error('진단 요청 실패:', error);

      // 에러 발생 시 사용자에게 안내 말풍선 표시
      const errorMessage = {
        id: Date.now() + 2,
        text: "진단 서버와 연결할 수 없습니다.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      // 성공·실패 여부와 관계없이 로딩 상태 해제
      setIsLoading(false);
    }
  };

  /**
   * 입력창 키다운 이벤트 핸들러
   * - Enter 단독 입력: 메시지 전송 (기본 줄바꿈 방지)
   * - Shift + Enter: 줄바꿈 (기본 동작 유지)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 대화 이름 변경 핸들러
   * - 서버에 PUT 요청으로 세션 제목을 업데이트
   * - 성공 시 로컬 chatHistory 상태도 즉시 반영 (전체 재요청 없이)
   *
   * @param {string} sessionId - 이름을 바꿀 대화의 세션 ID
   * @param {string} newName   - 새로 지정할 제목
   */
  const handleRenameChat = async (sessionId, newName) => {
    try {
      await axios.put(`/api/diagnosis-logs/session/${sessionId}`, { title: newName });

      // 해당 항목의 title만 교체 (나머지 항목은 그대로 유지)
      setChatHistory(prev =>
        prev.map(chat => chat.id === sessionId ? { ...chat, title: newName } : chat)
      );
    } catch (error) {
      console.error("이름 변경 실패", error);
      alert("이름 변경 중 오류가 발생했습니다.");
    }
  };

  /**
   * 대화 삭제 핸들러
   * - 서버에 DELETE 요청으로 해당 세션의 모든 로그를 삭제
   * - 성공 시 서버에서 최신 기록을 다시 불러와 사이드바 목록을 동기화
   * - 현재 보고 있는 대화가 삭제된 경우 새 대화 화면으로 전환
   *
   * @param {string} sessionId - 삭제할 대화의 세션 ID
   */
  const handleDeleteChat = async (sessionId) => {
    try {
      await axios.delete(`/api/diagnosis-logs/session/${sessionId}`);

      // 삭제 후 서버 기록을 다시 불러와 목록을 최신 상태로 동기화
      await fetchChatHistory();

      // 지금 보고 있던 대화가 삭제된 경우 새 대화로 전환
      // currentSessionId === null 이고 sessionId가 'no_session'인 엣지 케이스도 처리
      if (currentSessionId === sessionId || (currentSessionId === null && sessionId === 'no_session')) {
        handleNewChat();
      }
      console.log('삭제 완료');

    } catch (error) {
      console.error("삭제 실패", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // ─── 렌더링 ─────────────────────────────────────────────────────────────────
  return (
    <div className="chat-container">

      {/* 왼쪽 슬라이드 사이드바: 대화 기록 목록 + 편집 기능 */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        chats={chatHistory}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* 사이드바가 열릴 때 뒤를 어둡게 덮는 오버레이 — 클릭 시 사이드바 닫기 */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── 채팅 뷰 영역 ─────────────────────────────────────────────────────── */}
      <div className="chat-view">

        {/* 좌상단 "기록 보기" 버튼 — 클릭 시 사이드바 열기 */}
        <div className="chat-header-toolbar">
          <button className="history-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
            <FaHistory /> <span className="btn-text">기록 보기</span>
          </button>
        </div>

        <div className="content-width full-height-content">
          {messages.length === 0 ? (
            /* ── 빈 화면: 환영 메시지 + 빠른 질문 제안 카드 ── */
            <div className="empty-state">
              <div className="ai-logo">🌱</div>
              <h2>안녕하세요, {plant.plant_name} 진단 AI입니다.</h2>
              <p>식물 사진을 올리거나, 궁금한 증상을 물어보세요.</p>
              <div className="suggestion-grid">
                {suggestions.map((text, index) => (
                  /* 제안 카드 클릭 시 해당 텍스트로 즉시 메시지 전송 */
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
            /* ── 메시지 목록 ──────────────────────────────────────────────── */
            <div className="message-list-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>

                  {/* AI 메시지일 때만 왼쪽에 로봇 아이콘 아바타 표시 */}
                  {msg.sender === 'ai' && (
                    <div className="message-avatar"><FaRobot /></div>
                  )}

                  <div className="message-bubble">
                    {/* 이미지가 첨부된 경우 말풍선 상단에 표시 */}
                    {msg.image && (
                      <img src={msg.image} alt='전송된 사진' className='message-image'/>
                    )}

                    {/* 새로 받은 AI 응답이면 타이핑 애니메이션(Typewriter) 적용
                        과거 메시지이거나 사용자 메시지이면 일반 텍스트로 렌더링
                        줄바꿈 문자(\n)는 <br /> 태그로 변환 */}
                    {msg.sender === 'ai' && msg.isNew ? (
                      <Typewriter text={msg.text} speed={30} onUpdate={scrollToBottom}/>
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

                  {/* 사용자 메시지일 때만 오른쪽에 사람 아이콘 아바타 표시 */}
                  {msg.sender === 'user' && (
                    <div className="message-avatar user"><FaUser /></div>
                  )}
                </div>
              ))}

              {/* AI 응답 대기 중 로딩 말풍선 (점 3개 깜빡임 애니메이션) */}
              {isLoading && (
                <div className="message-row ai">
                  <div className="message-avatar"><FaRobot /></div>
                  <div className="message-bubble loading">
                    <div className="dot-flashing"></div>
                  </div>
                </div>
              )}

              {/* 스크롤 기준점: 새 메시지 도착 시 여기로 scrollIntoView 호출 */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 하단 입력 영역이 메시지를 가리지 않도록 아래쪽 여백 확보 */}
          <div className="bottom-spacer"></div>
        </div>
      </div>

      {/* ── 하단 입력 영역 ────────────────────────────────────────────────────── */}
      <div className="input-section">
        <div className="content-width">
          <div className="input-box">

            {/* 이미지 선택 시 미리보기 + X(취소) 버튼 표시 */}
            {selectImage && (
              <div className="inner-image-preview">
                <img src={selectImage.preview} alt='미리보기'/>
                <button onClick={() => setSelectImage(null)}><FaTimes/></button>
              </div>
            )}

            <div className="input-row">
              {/* 숨겨진 파일 입력 — 아래 + 버튼의 click()으로 트리거됨 */}
              <input
                type="file"
                accept='image/*'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

              {/* 이미지 첨부 버튼 (+) — 클릭 시 숨겨진 파일 입력 열기 */}
              <button className='icon-btn' onClick={() => fileInputRef.current.click()}>
                <FaPlus />
              </button>

              {/* 텍스트 입력 영역 (내용 길이에 따라 높이 자동 조절, Shift+Enter로 줄바꿈) */}
              <textarea
                ref={textareaRef}
                placeholder={`${plant.plant_name}에 대해 물어보세요.`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              {/* 전송 버튼 — 로딩 중에는 비활성화 */}
              <button
                className='send-btn'
                onClick={() => handleSendMessage()}
                disabled={isLoading}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>

          {/* 하단 면책 문구 */}
          <p className='disclaimer'>AI는 실수를 할 수 있습니다. 정확한 정보는 전문가와 상담하세요.</p>
        </div>
      </div>
    </div>
  );
}

export default Chat;