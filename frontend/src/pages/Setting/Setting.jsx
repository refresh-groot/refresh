import React, { useState, useEffect } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { useBluetooth } from '../../context/BluetoothContext';
import { useAuth } from '../../context/AuthContext';
import { Bluetooth } from '../../hooks/Bluetooth';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../../app/alert';
import Swal from 'sweetalert2';
import { showToast } from '../../app/alert';
import api from '../../api/axios';
import './Setting.css';

function Setting() {
  const { user, logout } = useAuth();
  const { deviceName, handleConnectSuccess } = useBluetooth();
  const navigate = useNavigate();

  const [bio, setBio] = useState('');
  const [isAlertOn, setIsAlertOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bioSaving, setBioSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/user/profile');
        setBio(res.data.bio || '');
        setIsAlertOn(res.data.isAlertOn || false);
      } catch (e) {
        console.error('프로필 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
    const result = await Swal.fire({
      title: '로그아웃 하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '로그아웃',
      cancelButtonText: '취소',
      confirmButtonColor: '#e67e22',
    });
    if (result.isConfirmed) {
      await logout();
      showAlert('success', '성공', '로그아웃에 성공했습니다.', 1500);
      navigate('/login');
    }
  };

  const handleWithdraw = async () => {
    const { value: password } = await Swal.fire({
      title: '회원 탈퇴',
      text: '비밀번호를 입력해주세요.',
      input: 'password',
      inputPlaceholder: '비밀번호',
      showCancelButton: true,
      confirmButtonText: '탈퇴하기',
      cancelButtonText: '취소',
      confirmButtonColor: '#e74c3c',
    });
    if (!password) return;
    try {
      await api.delete('/api/user/withdraw', { data: { password } });
      Swal.fire('완료', '회원 탈퇴가 완료되었습니다.', 'success').then(() => logout());
    } catch (e) {
      const msg = e.response?.status === 401
        ? '비밀번호가 일치하지 않습니다.'
        : '오류가 발생했습니다.';
      Swal.fire('오류', msg, 'error');
    }
  };

  const initials = user?.nickname ? user.nickname.slice(0, 2) : 'RE';

  if (loading) return <div className="setting-loading">불러오는 중...</div>;

  return (
    <div className="setting-page">
      <div className="setting-inner">

        {/* ── 왼쪽 ── */}
        <div className="setting-left">

          {/* 프로필 */}
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
                <Bluetooth onConnectSuccess={handleConnectSuccess} />
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
                <button className="action-btn orange" onClick={handleLogout}>로그아웃</button>
              </div>

              <div className="danger-banner">
                <div>
                  <div className="danger-title">회원 탈퇴</div>
                  <div className="danger-desc">탈퇴 시 모든 데이터가 삭제됩니다</div>
                </div>
                <button className="danger-btn" onClick={handleWithdraw}>탈퇴하기</button>
              </div>

              <div className="version-row">
                <span className="version-label">앱 버전</span>
                <span className="version-val">v1.0.0</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Setting;