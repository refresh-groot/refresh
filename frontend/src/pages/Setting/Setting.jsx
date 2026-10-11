// frontend/src/pages/Setting/Setting.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { useBluetooth } from '../../hooks/useBluetooth';
import { useAuth } from '../../context/AuthContext';
import { Bluetooth } from '../../components/Bluetooth/Bluetooth';
import { useNavigate, useLocation } from 'react-router-dom'; 
import Swal, { showToast } from '../../app/alert';
import api from '../../api/axios';
import './Setting.css';

const getStoredPlant = () => {
  try {
    const plants = JSON.parse(localStorage.getItem('my-plants') || '[]');
    const selectedPlantId = localStorage.getItem('selected-plant-id');
    if (!Array.isArray(plants)) return null;
    return plants.find((item) => String(item.id) === selectedPlantId) || plants[0] || null;
  } catch {
    return null;
  }
};

function Setting() {
  const { user, logout } = useAuth();
  const { deviceName } = useBluetooth();
  const navigate = useNavigate();
  const location = useLocation(); 

  // 메뉴에서 전달받은 식물, 저장된 선택 식물, API 식물 목록 순으로 복원한다.
  const [plant, setPlant] = useState(() => location.state?.plant || getStoredPlant());
  const plantId = plant?.id;
  

  const [bio, setBio] = useState('');
  const [isAlertOn, setIsAlertOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [minMoisture, setMinMoisture] = useState(plant?.min_moisture ?? 30);
  const [waterDurationMs, setWaterDurationMs] = useState(plant?.water_duration_ms ?? 2000);
  const [hardwareSaving, setHardwareSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
      try {
        setProfileError(false);
        setLoading(true);
        const res = await api.get('/api/user/profile');
        setBio(res.data.bio || '');
        setIsAlertOn(res.data.isAlertOn || false);
      } catch (e) {
        console.error('프로필 불러오기 실패:', e);
        setProfileError(true);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const incomingPlant = location.state?.plant;
    if (!incomingPlant?.id) return;

    setPlant(incomingPlant);
    localStorage.setItem('selected-plant-id', String(incomingPlant.id));
  }, [location.state?.plant]);

  useEffect(() => {
    if (plant?.id) return;

    let isActive = true;
    api.get('/api/plants')
      .then((response) => {
        const plants = Array.isArray(response.data) ? response.data : (response.data?.plants ?? []);
        if (!isActive || plants.length === 0) return;

        const selectedPlantId = localStorage.getItem('selected-plant-id');
        const selectedPlant = plants.find((item) => String(item.id) === selectedPlantId) || plants[0];
        setPlant(selectedPlant);
        localStorage.setItem('my-plants', JSON.stringify(plants));
        localStorage.setItem('selected-plant-id', String(selectedPlant.id));
      })
      .catch((error) => console.error('설정용 식물 목록 불러오기 실패:', error));

    return () => { isActive = false; };
  }, [plant?.id]);

  useEffect(() => {
    if (!plantId) return;
    api.get(`/api/plants/${plantId}/hardware`)
      .then((res) => {
        setMinMoisture(res.data.min_moisture ?? 30);
        setWaterDurationMs(res.data.water_duration_ms ?? 2000);
      })
      .catch((error) => console.error('급수 기준 불러오기 실패:', error));
  }, [plantId]);

  // 블루투스 연결 성공 시 자동으로 ID를 쏴주는 함수
  const handleBleSuccess = async (info) => {
    if (plantId && info?.sendCommand) {
        try {
            await info.sendCommand(`SET_ID ${plantId}`);
            showToast('success', `${plantId}번 식물과 연동되었습니다.`);
        } catch (err) {
            console.error("ID 전송 실패:", err);
            showToast('error', '기기 연동 중 오류가 발생했습니다.');
        }
    }
  };
  
  const handleBioSave = async () => {
    setBioSaving(true);
    try {
      await api.put('/api/user/profile', { bio });
      showToast('success', '저장 완료');
    } catch {
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
    } catch {
      setIsAlertOn(!next);
      Swal.fire('오류', '알림 설정 변경에 실패했습니다.', 'error');
    }
  };

  const handleHardwareSave = async () => {
    if (!plantId) return;
    const moisture = Number(minMoisture);
    const duration = Number(waterDurationMs);

    if (!Number.isInteger(moisture) || moisture < 1 || moisture > 100) {
      showToast('error', '최소 토양 수분은 1~100으로 입력해주세요.');
      return;
    }
    if (!Number.isInteger(duration) || duration < 100 || duration > 60000) {
      showToast('error', '급수 시간은 100~60000ms로 입력해주세요.');
      return;
    }

    setHardwareSaving(true);
    try {
      await api.patch(`/api/plants/${plantId}/hardware`, {
        min_moisture: moisture,
        water_duration_ms: duration,
      });
      showToast('success', '식물별 급수 기준을 저장했습니다.');
    } catch (error) {
      console.error('급수 기준 저장 실패:', error);
      showToast('error', '급수 기준 저장에 실패했습니다.');
    } finally {
      setHardwareSaving(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('user');
    await logout();
    navigate('/login');
  };

  const handleWithdraw = async () => {
    if (!withdrawPassword) return;
    try {
      await api.delete('/api/user/withdraw', { data: { password: withdrawPassword } });
      localStorage.removeItem('user');
      setShowWithdrawModal(false);
      showToast('success', '완료', '회원 탈퇴가 완료되었습니다.', 1000)
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
  if (profileError) {
    return (
      <div className="setting-page">
        <div className="request-error request-error--page">
          <span>설정 정보를 불러오지 못했습니다.</span>
          <button type="button" onClick={fetchProfile}>다시 시도</button>
        </div>
      </div>
    );
  }

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

          {/* 블루투스 */}
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
                {deviceName && (
                  <div className="ble-pill">
                    <div className="ble-dot" />연결됨
                  </div>
                )}
              </div>
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
                {/* 동료 추가된 부분 */}
                <Bluetooth onConnectSuccess={handleBleSuccess} />
              </div>
            </div>
          </div>
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

          {plantId && (
            <div className="s-card">
              <div className="s-card-header">
                <div className="s-card-icon green">💧</div>
                <span className="s-card-title">{plant?.plant_name} 급수 기준</span>
              </div>
              <div className="s-card-body hardware-settings">
                <label>
                  최소 토양 수분 (%)
                  <input type="number" min="1" max="100" value={minMoisture} onChange={(event) => setMinMoisture(event.target.value)} />
                </label>
                <label>
                  1회 급수 시간 (ms)
                  <input type="number" min="100" max="60000" step="100" value={waterDurationMs} onChange={(event) => setWaterDurationMs(event.target.value)} />
                </label>
                <p>AI 진단값 또는 사용자가 저장한 값을 ESP32가 다음 동기화 때 적용합니다.</p>
                <button className="bio-save-btn" onClick={handleHardwareSave} disabled={hardwareSaving}>
                  {hardwareSaving ? '저장 중...' : '급수 기준 저장'}
                </button>
              </div>
            </div>
          )}

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
