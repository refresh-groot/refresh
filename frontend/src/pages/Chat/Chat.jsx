import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import './Chat.css';
import axios from '../../api/axios';
import { useSensorData } from '../../hooks/useSensorData';
import { FaPlus, FaHistory, FaPaperPlane, FaUser, FaTimes, FaCamera, FaLeaf, FaTint, FaTemperatureHigh } from "react-icons/fa";

const getDiagnosisTone = (result = '') => {
  const text = String(result).toLowerCase();
  if (text.includes('통신') || text.includes('오류')) return { key: 'error', label: '재시도 필요' };
  if (text.includes('건강') || text.includes('정상') || text.includes('양호')) return { key: 'healthy', label: '관리 양호' };
  return { key: 'attention', label: '관리 확인' };
};

function DiagnosisResult({ result, confidence, recommendation, onRetry, onOpenSettings }) {
  const safeConfidence = Math.max(0, Math.min(100, Number(confidence) || 0));
  const tone = getDiagnosisTone(result);
  const isSensorFallback = String(result).includes('센서 기반');
  const needsRetry = safeConfidence < 50 || tone.key === 'error';
  const guides = String(recommendation || '상세 조치사항이 없습니다.')
    .split(/\n+/)
    .map((guide) => guide.trim())
    .filter(Boolean);

  return (
    <article className={`diagnosis-result diagnosis-result--${tone.key}`}>
      <div className="diagnosis-result-header">
        <span>{isSensorFallback ? '센서 기반 관리 안내' : 'AI 식물 진단'}</span>
        <strong className="diagnosis-status">{tone.label}</strong>
      </div>
      {isSensorFallback && (
        <p className="diagnosis-fallback-notice">
          AI 서버에 연결할 수 없어 현재 센서 데이터로 안내합니다. 사진 기반 진단 결과가 아닙니다.
        </p>
      )}
      <section className="diagnosis-result-section">
        <span className="diagnosis-result-label">진단 요약</span>
        <h3>{result}</h3>
      </section>
      <section className="diagnosis-result-section">
        <span className="diagnosis-result-label">관리 방법</span>
        <ul className="diagnosis-guide-list">
          {guides.map((guide, index) => <li key={index}>{guide}</li>)}
        </ul>
      </section>
      <div className="diagnosis-result-footer">
        <span>{isSensorFallback ? 'AI 서버 복구 후 사진 재진단 권장' : `AI 신뢰도 ${safeConfidence}%`}</span>
        <div>
          <button className="diagnosis-secondary-btn" onClick={onOpenSettings}>급수 기준 확인</button>
          {needsRetry && <button className="diagnosis-retry-btn" onClick={onRetry}>{isSensorFallback ? 'AI로 다시 진단' : '새 진단'}</button>}
        </div>
      </div>
    </article>
  );
}

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
  const navigate = useNavigate();
  const plant = location.state?.plant || { id: 0, plant_name: '반려식물' };

  const {sensorData} = useSensorData(plant.id);
  // ─── UI 상태 ───────────────────────────────────────────────────────────────

  // 사이드바(기록 패널)가 열려있는지 여부
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 채팅창에 표시되는 메시지 배열
  // 각 항목 형태: { id, text, images: [], sender('user'|'ai'), timestamp, isNew }
  const [messages, setMessages] = useState([]);

  // 하단 입력창의 텍스트 값
  const [inputText, setInputText] = useState('');

  // AI 응답을 기다리는 중인지 여부 (true이면 로딩 애니메이션 표시)
  const [isLoading, setIsLoading] = useState(false);

  // 사용자가 선택한 이미지들을 담는 배열: { file: File 객체, preview: 로컬 미리보기 URL }[]
  const [selectImage, setSelectImage] = useState([]);

  // ─── 사이드바 / 세션 상태 ──────────────────────────────────────────────────

  // 사이드바에 표시될 대화 기록 목록 (서버에서 불러온 데이터)
  const [chatHistory, setChatHistory] = useState([]);

  // 현재 진행 중인 대화의 세션 ID
  // 메시지 전송 시 서버에 함께 보내 같은 대화 스레드에 기록되도록 함
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [submitNotice, setSubmitNotice] = useState('');
  

  // ─── DOM 참조 ──────────────────────────────────────────────────────────────

  // 메시지 목록 최하단 요소 참조 — 새 메시지 도착 시 여기로 스크롤
  const messagesEndRef = useRef(null);

  // 숨겨진 파일 입력 요소 참조 — 이미지 첨부 버튼 클릭 시 .click() 호출
  const fileInputRef = useRef(null);

  // 입력 textarea 참조 — 내용 길이에 따라 높이를 동적으로 조절하기 위해 사용
  const textareaRef = useRef(null);
  const previewUrlsRef = useRef([]);

  /**
   * 메시지 목록을 맨 아래로 부드럽게 스크롤하는 함수
   * - 새 메시지가 추가되거나 AI 응답이 오면 자동 호출됨
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 대시보드에서 진단 화면으로 들어오면 항상 새 세션으로 시작한다.
  // 과거 진단은 사용자가 기록 보기에서 선택했을 때만 열어 혼선을 막는다.
  useEffect(() => {
    if (!plant.id) return;

    setMessages([]);
    setSelectImage([]);
    setInputText('');
    setSubmitNotice('');
    setCurrentSessionId(generateSessionId());
    fetchChatHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [plant.id]);

  useEffect(() => {
    previewUrlsRef.current = selectImage.map((image) => image.preview);
  }, [selectImage]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // messages 배열 또는 isLoading 상태가 바뀔 때마다 스크롤을 맨 아래로 내림
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // inputText가 바뀔 때마다 textarea 높이를 내용에 맞게 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';                                   // 초기화
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
    selectImage.forEach((image) => URL.revokeObjectURL(image.preview));
    setMessages([]);
    setSelectImage([]); // [수정] 배열 초기화
    setInputText('');
    setIsSidebarOpen(false);
    setCurrentSessionId(generateSessionId());
    setSubmitNotice('');
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

  sessionLogs.sort((a, b) =>
    new Date(a.created_at || a.diagnosis_date) - new Date(b.created_at || b.diagnosis_date)
  );
  const convertedMessages = [];
  sessionLogs.forEach(log => {
    if (log.question) {
      // image_url 처리
      let imageUrls = [];
      
      if (log.image_url) {
        if (Array.isArray(log.image_url)) {
          // 배열로 온 경우
          imageUrls = log.image_url.filter(url => url);
        } else if (typeof log.image_url === 'string') {
          // 만약 문자열로 온 경우 대비
          imageUrls = log.image_url
            .split(',')
            .map(url => url.trim())
            .filter(url => url);
        }
      }

      // 상대 경로를 절대 URL로 변환
      const absoluteUrls = imageUrls.map(url => {
  // 이미 전체 URL이면 그대로 유지
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // [수정] 하드코딩된 주소를 지우고 상대 경로만 반환 (Vite Proxy 활용)
  if (url.startsWith('/uploads')) {
    return `${url}`; // [cite: 2097, 2099] 가이드 적용
  }
  // 파일명만 있는 경우
  return `/uploads/${url}`;
});

      convertedMessages.push({
        id: `user-${log.id}`,
        text: log.question,
        images: absoluteUrls, // 절대 URL 배열
        sender: 'user',
        timestamp: (log.diagnosis_date || '').slice(11, 16),
        isNew: false
      });
    }

    if (log.result) {
      const confidenceScore = log.confidence ? Math.round(log.confidence * 100) : 0;
      convertedMessages.push({
        id: `ai-${log.id}`,
        diagnosis: {
          result: log.result || '상담 완료',
          confidence: confidenceScore,
          recommendation: log.recommendation || '상세 조치사항이 없습니다.',
        },
        sender: 'ai',
        timestamp: (log.diagnosis_date || '').slice(11, 16),
        isNew: false
      });
    }
  });

  setMessages(convertedMessages);

  if (sessionData.raw_session_id) {
    setCurrentSessionId(sessionData.raw_session_id);
  }
  setIsSidebarOpen(false);
};

  /**
   * 서버에서 해당 식물의 전체 대화 기록을 불러와 사이드바 목록을 구성하는 함수
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
        const sKey = log.session_id || `legacy_${log.id}`;
        if (!grouped[sKey]) {
          grouped[sKey] = {
            id: sKey,
            raw_session_id: log.session_id,
            title: null,
            latestDate: log.diagnosis_date || log.created_at,
            logs: []
          };
        }
        grouped[sKey].logs.push(log);

        const logDate = new Date(log.diagnosis_date || log.created_at);
        if (logDate > new Date(grouped[sKey].latestDate)) {
          grouped[sKey].latestDate = log.diagnosis_date || log.created_at;
        }
      });

      // ── 각 그룹의 제목 결정 ────────────────────────────────────────────────
      Object.values(grouped).forEach(group => {
        group.logs.sort((a, b) =>
          new Date(a.diagnosis_date || a.created_at) - new Date(b.diagnosis_date || b.created_at)
        );
        const firstLog = group.logs[0];

        if (firstLog.title && firstLog.title !== '새로운 상담') {
          group.title = firstLog.title;
        } else {
          group.title = firstLog.question || '상담 기록';
        }
      });

      const historyList = Object.values(grouped).sort((a, b) =>
        new Date(b.latestDate) - new Date(a.latestDate)
      );

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
   * [수정] 여러 파일을 배열로 처리하도록 변수 이름 및 로직 수정
   */
  const handleImageSelect = (e) => {
    const selectedFiles = Array.from(e.target.files); // [수정] 변수명 명확화
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);

    if (validFiles.length !== selectedFiles.length) {
      setSubmitNotice('이미지 파일만 선택할 수 있으며, 한 장당 10MB 이하여야 합니다.');
    }

    if (validFiles.length > 0) {
      const newImages = validFiles.map(file => ({
        file: file,
        preview: URL.createObjectURL(file)
      }));

      setSelectImage((prev) => {
        const combined = [...prev, ...newImages];
        const overflow = combined.slice(5);
        overflow.forEach((image) => URL.revokeObjectURL(image.preview));
        return combined.slice(0, 5);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * [수정] 개별 이미지 삭제 기능 수정
   */
  const removeImage = (index) => {
    setSelectImage(prev => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  /**
   * 메시지 전송 핸들러
   * [수정] 여러 장의 이미지를 FormData에 담아 전송하도록 수정
   */
  const handleSendMessage = async (textOverride) => {
  const textToSend = (typeof textOverride === 'string' ? textOverride : inputText);

  if (!plant.id) {
    setSubmitNotice('먼저 대시보드에서 진단할 식물을 선택해주세요.');
    return;
  }
  if (!textToSend.trim() && selectImage.length === 0) return;

  // 임시 ID 생성
  const tempMessageId = Date.now();
  
  const userMessage = {
    id: tempMessageId,
    text: textToSend,
    images: selectImage.map(img => img.preview), // 임시 미리보기
    sender: 'user',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  setMessages((prev) => [...prev, userMessage]);

  const imagesToUpload = [...selectImage];
  const sessionId = currentSessionId || generateSessionId();
  if (!currentSessionId) setCurrentSessionId(sessionId);
  setInputText('');
  setSelectImage([]);
  setSubmitNotice('');
  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('question', textToSend);
    if (sensorData) {
      // null 값은 제외하고 값이 있는 센서 데이터만 전송
      const validSensorData = Object.fromEntries(
        Object.entries(sensorData).filter(([, value]) => value !== null && value !== undefined)
      );

      if (Object.keys(validSensorData).length > 0) {
        formData.append('sensor_data', JSON.stringify(validSensorData));
      }
    }
    imagesToUpload.forEach(img => {
      formData.append('images', img.file); 
    });

    const response = await axios.post(`/api/diagnosis-logs/${plant.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 35000 
    });

    const serverData = response.data.data || response.data;
    
    // [추가] 서버에서 받은 실제 이미지 URL로 업데이트
    if (serverData.image_url && serverData.image_url.length > 0) {
  const serverImageUrls = Array.isArray(serverData.image_url) 
    ? serverData.image_url 
    : [serverData.image_url];
  
  const absoluteUrls = serverImageUrls.map(url => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // [수정] 상대 경로 방식으로 변경
    if (url.startsWith('/uploads')) {
      return `${url}`;
    }
    return `/uploads/${url}`;
  });
  
      // 사용자 메시지의 Blob URL을 서버 URL로 교체
      setMessages((prev) => prev.map(msg => 
        msg.id === tempMessageId 
          ? { ...msg, images: absoluteUrls }
          : msg
      ));
    }

    const confidenceScore = serverData.confidence ? Math.round(serverData.confidence * 100) : 0;
    const aiMessage = {
      id: Date.now() + 1,
      diagnosis: {
        result: serverData.result || '분석 중',
        confidence: confidenceScore,
        recommendation: serverData.recommendation || '특별한 조치사항이 없습니다.',
      },
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMessage]);
    fetchChatHistory();

  } catch (error) {
    console.error('진단 요청 실패:', error);
    const errorMessage = {
      id: Date.now() + 2,
      text: "진단 서버와 연결할 수 없습니다.",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRenameChat = async (sessionId, newName) => {
    try {
      await axios.put(`/api/diagnosis-logs/session/${sessionId}`, { title: newName });
      setChatHistory(prev =>
        prev.map(chat => chat.id === sessionId ? { ...chat, title: newName } : chat)
      );
    } catch (error) {
      console.error("이름 변경 실패", error);
    }
  };

  const handleDeleteChat = async (sessionId) => {
    try {
      await axios.delete(`/api/diagnosis-logs/session/${sessionId}`);
      await fetchChatHistory();
      if (currentSessionId === sessionId || (currentSessionId === null && sessionId === 'no_session')) {
        handleNewChat();
      }
    } catch (error) {
      console.error("삭제 실패", error);
    }
  };

  return (
    <div className="chat-container">
      <ChatSidebar
        isOpen={isSidebarOpen}
        chats={chatHistory}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="chat-view">
        <div className="chat-header-toolbar">
          <button className="history-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
            <FaHistory /> <span className="btn-text">기록 보기</span>
          </button>
          <div className="diagnosis-plant-chip"><FaLeaf /> {plant.plant_name}</div>
        </div>

        <div className="content-width full-height-content">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="ai-logo"><FaLeaf /></div>
              <p className="empty-state-eyebrow">REFRESH AI CARE</p>
              <h2>{plant.plant_name}의 상태를 확인해볼까요?</h2>
              <p>사진과 현재 증상을 함께 보내면 더 정확하게 분석할 수 있어요.</p>
              <div className="diagnosis-context-card">
                <div><FaTemperatureHigh /><span>온도</span><strong>{sensorData.temp ?? '--'}°C</strong></div>
                <div><FaTint /><span>토양 수분</span><strong>{sensorData.soil ?? '--'}%</strong></div>
                <div><FaLeaf /><span>식물 종류</span><strong>{plant.species || '미등록'}</strong></div>
              </div>
              <button
                className="photo-diagnosis-btn"
                onClick={() => plant.id ? fileInputRef.current?.click() : setSubmitNotice('먼저 대시보드에서 진단할 식물을 선택해주세요.')}
              >
                <FaCamera /> 사진으로 진단 시작
              </button>
              <div className="suggestion-grid">
                {suggestions.map((text, index) => (
                  <button key={index} className="suggestion-card" onClick={() => handleSendMessage(text)}>
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender} ${msg.diagnosis ? 'diagnosis-message' : ''}`}>
                  {msg.sender === 'ai' && (
                    <div className="message-avatar"></div>
                  )}

                  <div className="message-bubble">
                    {msg.images && msg.images.length > 0 && (
                      <div className="message-images-grid">
                        {msg.images.map((img, idx) => (
                          <img 
                          key={idx} 
                          src={img} 
                          alt='전송된 사진' 
                          className='message-image'
                          />
                        ))}
                      </div>
                    )}

                    {msg.sender === 'ai' && msg.diagnosis ? (
                      <DiagnosisResult
                        {...msg.diagnosis}
                        onRetry={handleNewChat}
                        onOpenSettings={() => navigate('/setting', { state: { plant } })}
                      />
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

                  {msg.sender === 'user' && (
                    <div className="message-avatar user"><FaUser /></div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="message-row ai">
                  <div className="message-avatar"></div>
                  <div className="message-bubble loading diagnosis-loading-card">
                    <span className="diagnosis-loading-icon"><FaLeaf /></span>
                    <div>
                      <strong>사진과 센서 데이터를 분석하고 있어요</strong>
                      <span>잎 상태와 관리 환경을 함께 확인하는 중입니다.</span>
                      <div className="analysis-skeleton" aria-hidden="true"><i /><i /><i /></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          <div className="bottom-spacer"></div>
        </div>
      </div>

      <div className="input-section">
        <div className="content-width">
          <div className="input-box">
            {selectImage.length > 0 && (
              <div className="multi-image-preview-area">
                {selectImage.map((img, index) => (
                  <div key={index} className="inner-image-preview">
                    <img src={img.preview} alt='미리보기'/>
                    <button onClick={() => removeImage(index)}><FaTimes/></button>
                  </div>
                ))}
              </div>
            )}

            <div className="input-row">
              <input
                type="file"
                accept='image/*'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                multiple 
              />

              <button className='icon-btn' onClick={() => fileInputRef.current?.click()} disabled={!plant.id || isLoading} aria-label="진단 사진 추가">
                <FaPlus />
              </button>

              <textarea
                ref={textareaRef}
                placeholder={plant.id ? `${plant.plant_name}의 증상을 입력해주세요.` : '대시보드에서 식물을 선택해주세요.'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={!plant.id || isLoading}
              />

              <button className='send-btn' onClick={() => handleSendMessage()} disabled={isLoading || !plant.id} aria-label="진단 요청 보내기">
                <FaPaperPlane />
              </button>
            </div>
          </div>
          {submitNotice && <p className="chat-submit-notice">{submitNotice} <button onClick={() => navigate('/profile')}>식물 보러가기</button></p>}
          <p className='disclaimer'>AI 진단은 관리 보조 기능입니다. 심한 병해는 전문가의 확인이 필요할 수 있어요.</p>
        </div>
      </div>
    </div>
  );
}

export default Chat;
