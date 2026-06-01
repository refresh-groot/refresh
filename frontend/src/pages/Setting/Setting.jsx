// frontend/src/pages/Setting/Setting.jsx
import React, { useState, useEffect } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { useBluetooth } from '../../context/BluetoothContext';
import { useAuth } from '../../context/AuthContext';
import { Bluetooth } from '../../hooks/Bluetooth';
// ▼▼▼ [수정된 부분] 기존 코드 유지를 위해 useParams와 useLocation을 모두 가져옵니다 ▼▼▼
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { showAlert } from '../../app/alert';
import Swal from 'sweetalert2';
import { showToast } from '../../app/alert';
import api from '../../api/axios';
import './Setting.css';

function Setting() {
  const { user, logout } = useAuth();
  const { deviceName, handleConnectSuccess, sendCommand } = useBluetooth(); // sendCommand 추가
  const navigate = useNavigate();
  const location = useLocation(); // location 추가

  // ▼▼▼ [추가된 부분] URL에서 plantId를 직접 추출 (새로고침해도 절대 날아가지 않음) ▼▼▼
  const { plantId: paramPlantId } = useParams();

  // 상세 페이지에서 넘겨준 식물 정보가 있는지 확인
  const plant = location.state?.plant; 
  
  // ▼▼▼ [추가된 부분] URL 파라미터가 있다면 우선 사용하고, 없으면 기존 location 방식을 씁니다 ▼▼▼
  const plantId = paramPlantId || plant?.id;
  
  console.log("▶ 세팅 페이지 진입 완료. 가져온 식물 ID:", plantId);

  // ▼▼▼ [추가] 연결 끊기를 위해 Bluetooth.jsx에서 넘겨준 전체 객체를 기억하는 상태 ▼▼▼
  const [bleInfo, setBleInfo] = useState(null);

  // ▼▼▼ [추가된 부분] 이미 연결된 상태에서 다른 식물 세팅창으로 들어오면 자동으로 ID 갱신 ▼▼▼
  useEffect(() => {
    if (plantId && sendCommand && deviceName) {
      console.log(`🔄 [자동 동기화] ${plantId}번 식물 설정창 진입. 기기에 ID 전송 시도...`);
      sendCommand(`SET_ID ${plantId}`).catch(err => console.error("자동 동기화 실패:", err));
    }
  }, [plantId, sendCommand, deviceName]);
  // ▲▲▲ [추가된 부분] ▲▲▲

  const [bio, setBio] = useState('');
  const [isAlertOn, setIsAlertOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bioSaving, setBioSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');

  // ▼▼▼ [수정된 부분] plantId가 바뀔 때마다 다시 프로필/알림 상태를 가져오도록 의존성 배열 수정 ▼▼▼
  useEffect(() => {
    const fetchProfile = async () => {
      // plantId가 있으면 뒤에 쿼리 스트링으로 붙입니다.
      const url = plantId ? `/api/user/profile?plantId=${plantId}` : '/api/user/profile';
      
      try {
        setLoading(true);
        const res = await api.get(url);
        setBio(res.data.bio || '');
        setIsAlertOn(res.data.isAlertOn || false);
      } catch (e) {
        console.error('프로필 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [plantId]);

  // 블루투스 연결 성공 시 자동으로 ID를 쏴주는 함수
  const handleBleSuccess = async (info) => {
    handleConnectSuccess(info); // 기기 이름 저장 (기존 기능)
    setBleInfo(info); // [추가] disconnectBluetooth가 포함된 객체를 상태에 저장

    // 만약 세팅창에 들어올 때 식물 정보(ID)를 들고 왔다면? 기기로 바로 전송!
    if (plantId && info.sendCommand) {
        console.log(`기존 식물(${plantId}) ID 연동 시도...`);
        try {
            await info.sendCommand(`SET_ID ${plantId}`);
            
            // ▼▼▼ [추가된 부분] 서버 DB에 기기 매핑 정보 저장 요청 ▼▼▼
            try {
                // 백엔드에 plantId와 기기 이름(deviceName)을 묶어서 업데이트 요청
                await api.put(`/api/plants/${plantId}/device`, { device_name: info.deviceName });
                console.log('서버 DB 기기 매핑 완료');
                showToast('success', `${plantId}번 식물과 연동되었습니다.`);
            } catch (dbErr) {
                console.error("서버 DB 매핑 실패:", dbErr);
                // 백엔드에서 중복 기기(409) 에러를 뱉으면 팝업 띄우기
                if (dbErr.response?.status === 409) {
                    Swal.fire('연동 실패', '이미 다른 식물과 연결된 기기입니다.', 'error');
                } else {
                    showToast('error', '서버 데이터 저장 중 오류가 발생했습니다.');
                }
            }
            // ▲▲▲ [추가된 부분] ▲▲▲
            
        } catch (err) {
            console.error("ID 전송 실패:", err);
            showToast('error', '기기 연동 중 오류가 발생했습니다.');
        }
    }
  };
  
  // ▼▼▼ [추가] 사용자가 수동으로 연결을 해제할 때 호출되는 함수 ▼▼▼
  const handleDisconnectClick = async () => {
    try {
        // 1. 서버 DB에서 이 식물의 매핑 정보(device_name)를 비움
        await api.delete(`/api/plants/${plantId}/device`);
        console.log("✅ DB 기기 매핑 해제 성공");
        
        // 2. 물리적 블루투스 연결 차단
        if (bleInfo?.disconnectBluetooth) {
            bleInfo.disconnectBluetooth();
        }
        
        // 3. UI 상태 리셋
        setBleInfo(null);
        handleConnectSuccess(null); // Context의 기기명 초기화
        showToast('success', '기기 연동이 해제되었습니다.');
    } catch (err) {
        console.error("연동 해제 실패:", err);
        showToast('error', '연동 해제 중 오류가 발생했습니다.');
    }
  };
  // ▲▲▲ [추가] ▲▲▲

  const handleBioSave = async () => {
    setBioSaving(true);
    try {
      await api.put('/api/user/profile', { bio });
      showToast('success', '저장 완료');
    } catch (e) {
      showToast('fail','저장 실패');
    } finally {
      setBioSaving(false);
    }
  };

  const handleAlertToggle = async () => {
    const next = !isAlertOn;
    setIsAlertOn(next);
    try {
      await api.patch('/api/user/alert', { isAlertOn: next });
    } catch (e) {
      setIsAlertOn(!next);
      Swal.fire('오류', '알림 설정 변경에 실패했습니다.', 'error');
    }
  };

const handleLogout = async () => {
    localStorage.removeItem('user');
    await logout();
    showAlert('success', '성공', '로그아웃에 성공했습니다.', 1500);
    navigate('/login');
  };

  const handleWithdraw = async () => {
    if (!withdrawPassword) return;
    try {
      await api.delete('/api/user/withdraw', { data: { password: withdrawPassword } });
      localStorage.removeItem('user');
      setShowWithdrawModal(false);
      showAlert('success', '완료', '회원 탈퇴가 완료되었습니다.', 1000)
        .then(() => navigate('/login'));
    } catch (e) {
      const msg = e.response?.status === 401
        ? '비밀번호가 일치하지 않습니다.'
        : '오류가 발생했습니다.';
      showToast('error', msg);
    }
  };

  const initials = user?.nickname ? user.nickname.slice(0, 2) : 'RE';

  if (loading) return <div className="setting-loading">불러오는 중...</div>;

  return (
    <div className="setting-page">
      <div className="setting-inner">

        <div className="setting-left">

          <div className="s-card">
            <div className="s-card-header">
              <div className="s-card-icon green">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#2ecc71">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <span className="s-card-title">내 프로필</span>
            </div>
            <div className="s-card-body">
              <div className="profile-row">
                <div className="profile-avatar">{initials}</div>
                <div className="profile-info">
                  <div className="profile-name">{user?.nickname || '사용자'}</div>
                  <div className="profile-email">{user?.email || ''}</div>
                </div>
              </div>
              <div className="bio-row">
                <input
                  className="bio-input"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="한 줄 소개를 입력하세요"
                  maxLength={50}
                />
                <button className="bio-save-btn" onClick={handleBioSave} disabled={bioSaving}>
                  {bioSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* ▼▼▼ [추가/수정된 부분] 식물 ID가 있을 때만 블루투스 카드를 렌더링하도록 감싸기 ▼▼▼ */}
          {plantId && (
          <div className="s-card">
            <div className="s-card-header">
              <div className="s-card-icon purple">
                <FaBluetooth size={13} color="#7f77dd" />
              </div>
              <span className="s-card-title">블루투스 기기</span>
            </div>
            <div className="s-card-body">
              <div className="s-row">
                <div className="s-row-icon" style={{ background: deviceName ? '#e8f5e9' : '#f0f0f0' }}>
                  <FaBluetooth size={13} color={deviceName ? '#2ecc71' : '#aaa'} />
                </div>
                <div className="s-row-text">
                  <div className="s-row-label">{deviceName || '연결된 기기 없음'}</div>
                  <div className="s-row-sub">
                    {deviceName ? '연결됨' : 'ESP32_PUMP 기기를 검색하세요'}
                  </div>
                </div>
                {/* ▼▼▼ [수정] 기기 연결됨 상태일 때, 클릭하면 연동이 해제되는 버튼으로 변경 ▼▼▼ */}
                {deviceName && (
                  <div 
                    className="ble-pill" 
                    onClick={handleDisconnectClick}
                    style={{ cursor: 'pointer', backgroundColor: '#ffebee', color: '#e53935', border: '1px solid #ffcdd2' }}
                    title="클릭하여 연결 해제"
                  >
                    <div className="ble-dot" style={{ backgroundColor: '#e53935' }}/>연결 해제
                  </div>
                )}
                {/* ▲▲▲ [수정] ▲▲▲ */}
              </div>
              
              {/* ▼▼▼ [수정] 기기가 연결되어 있지 않을 때만 '기기 연결' 버튼 섹션을 보여줍니다 ▼▼▼ */}
              {!deviceName && (
              <div className="s-row no-border">
                <div className="s-row-icon" style={{ background: '#f0f0f0' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#aaa">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                </div>
                <div className="s-row-text">
                  <div className="s-row-label">기기 연결</div>
                  <div className="s-row-sub">ESP32_PUMP 검색 후 연결</div>
                </div>
                <Bluetooth onConnectSuccess={handleBleSuccess} />
              </div>
              )}
              {/* ▲▲▲ [수정] ▲▲▲ */}
            </div>
          </div>
          )}

        </div>

        {/* ── 오른쪽 ── */}
        <div className="setting-right">

          {/* 알림 */}
          <div className="s-card">
            <div className="s-card-header">
              <div className="s-card-icon amber">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#f39c12">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <span className="s-card-title">알림 설정</span>
            </div>
            <div className="s-card-body">
              <div className="s-row no-border">
                <div className="s-row-text">
                  <div className="s-row-label">알림 받기</div>
                  <div className="s-row-sub">이상 감지 시 푸시 알림 수신</div>
                </div>
                <div className={`toggle ${isAlertOn ? 'on' : 'off'}`} onClick={handleAlertToggle}>
                  <div className="toggle-knob" />
                </div>
              </div>
            </div>
          </div>

          {/* 계정 관리 */}
          <div className="s-card">
            <div className="s-card-header">
              <div className="s-card-icon gray">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#888">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                </svg>
              </div>
              <span className="s-card-title">계정 관리</span>
            </div>
            <div className="s-card-body">
              <div className="s-row">
                <div className="s-row-icon" style={{ background: '#fff3ee' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#e67e22">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                </div>
                <div className="s-row-text">
                  <div className="s-row-label">로그아웃</div>
                  <div className="s-row-sub">현재 기기에서 로그아웃</div>
                </div>
                <button className="action-btn orange" onClick={() => setShowLogoutModal(true)}>로그아웃</button>
              </div>

              <div className="danger-banner">
                <div>
                  <div className="danger-title">회원 탈퇴</div>
                  <div className="danger-desc">탈퇴 시 모든 데이터가 삭제됩니다</div>
                </div>
                <button className="danger-btn" onClick={() => setShowWithdrawModal(true)} >탈퇴하기</button>
              </div>

              <div className="version-row">
                <span className="version-label">앱 버전</span>
                <span className="version-val">v1.0.0</span>
              </div>
            </div>
          </div>

        </div>
      </div>
            {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowLogoutModal(false)}>✕</button>
            <h2>로그아웃</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              현재 기기에서 로그아웃 하시겠습니까?
            </p>
            <div className="modal-btns">
              <button className="modal-cancel-btn" onClick={() => setShowLogoutModal(false)}>취소</button>
              <button className="modal-confirm-btn orange" onClick={handleLogout}>로그아웃</button>
            </div>
          </div>
        </div>
      )}
      
            {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setShowWithdrawModal(false); setWithdrawPassword(''); }}>✕</button>
            <h2>회원 탈퇴</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '20px' }}>
              비밀번호를 입력해주세요.
            </p>
            <div className="modal-input-group">
              <input
                type="password"
                placeholder="비밀번호"
                value={withdrawPassword}
                onChange={e => setWithdrawPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleWithdraw()}
              />
            </div>
            <div className="modal-btns">
              <button className="modal-cancel-btn" onClick={() => { setShowWithdrawModal(false); setWithdrawPassword(''); }}>취소</button>
              <button className="modal-confirm-btn red" onClick={handleWithdraw}>탈퇴하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Setting;