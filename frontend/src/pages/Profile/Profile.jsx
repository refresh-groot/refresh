import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaPlus, FaCalendarAlt, FaUserCircle, FaTrash } from 'react-icons/fa';
import { LuPencilLine } from "react-icons/lu";
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import AddPlantModal from './AddPlantModal';
import EditPlantModal from './EditPlantModal';
import api from '../../api/axios';
import { showToast } from '../../app/alert';

// 식물 목록 조회, 등록, 수정, 삭제 및 필터링 기능을 제공하는 프로필 대시보드 컴포넌트
function Profile() {
  const navigate = useNavigate();
  // AuthContext에서 로그인한 사용자 정보와 인증 로딩 상태를 가져옴
  const { user, loading: authLoading } = useAuth();
  
  // 모달 표시 및 데이터 관리를 위한 상태
  const [editingPlant, setEditingPlant] = useState(null); // 수정 중인 식물 객체
  const [isModalOpen, setIsModalOpen] = useState(false);  // 추가 모달 열림 여부
  const [plants, setPlants] = useState([]);               // 전체 식물 목록
  const [loading, setLoading] = useState(true);           // 데이터 로딩 상태
  const [currentTab, setCurrentTab] = useState('all');    // 필터 탭 상태 (전체/생존/사망)

  // 현재 탭 설정에 따라 식물 목록을 필터링하고 정렬하는 로직
  // 1. 탭 기준(alive/dead)에 따라 필터링
  // 2. 사망한 식물('archived')은 목록의 맨 아래로 정렬
  const filteredPlants = plants.filter(plant => {
    const dbStatus = plant.status || 'active';
    if (currentTab === 'alive') {return dbStatus === 'active';}
    if (currentTab === 'dead') {return dbStatus === 'archived';}
    return true;
  })
  .sort((a,b) => {
    const statusA = a.status || 'active';
    const statusB = b.status || 'active';
    // 사망한 식물은 우선순위를 낮게 설정하여 뒤로 보냄
    if (statusA === 'archived' && statusB !== 'archived') return 1;
    if (statusA !== 'archived' && statusB === 'archived') return -1;
    return 0;
  });

  // 디버깅용 로그
  console.log('전체 식물 수:', plants.length);
  console.log('필터링된 식물 수:', filteredPlants.length);
  console.log('현재 탭:', currentTab);

  /* ===============================
     초기화: 로그인 체크 및 데이터 로드
  =============================== */
  useEffect(() => {
    // 인증 상태 확인이 끝날 때까지 대기
    if (authLoading) return;

    // 비로그인 상태면 경고 후 로그인 페이지로 이동
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: '로그인 필요',
        text: '로그인 후 이용해주세요.',
      }).then(() => navigate('/login'));
      return;
    }

    // 로그인 확인 후 식물 목록 조회
    fetchPlants();
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="profile-container">로딩 중...</div>;
  }

  /* ===============================
     API: 식물 목록 조회 (GET)
  =============================== */
  const fetchPlants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/plants');
      const data = res.data;

      // 서버 응답 구조(배열 또는 객체)에 따라 유연하게 상태 업데이트
      if (Array.isArray(data)) {
        setPlants(data);
      } else if (data?.plants) {
        setPlants(data.plants);
      } else {
        setPlants([]);
      }
    } catch (error) {
      console.error('식물 불러오기 실패:', error);

      // 인증 토큰 만료 시 처리
      if (error.response?.status === 401) {
        Swal.fire('인증 만료', '다시 로그인해주세요.', 'error')
          .then(() => navigate('/login'));
      } else {
        Swal.fire('오류', '식물 목록을 불러오지 못했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     API: 식물 등록 (POST)
  =============================== */
  const handleSavePlant = async (nickname, species, date, file) => {
    try {
      const safeSpecies =
        species && species.trim() !== '' ? species : '기타';
      
      // 이미지 파일 전송을 위해 FormData 객체 사용 (JSON 대신 multipart/form-data 형식 필요)
      const formData = new FormData();
      formData.append('plant_name', nickname);
      formData.append('species', safeSpecies);
      formData.append('reg_date', date);
      if (file) formData.append('img', file);

      await api.post('/api/plants', formData);

      showToast('success','등록 완료');

      // 목록 갱신
      fetchPlants();
    } catch (error) {
      console.error('식물 등록 실패:', error);
      Swal.fire('등록 실패', '식물 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  /* ===============================
     API: 식물 삭제 (DELETE)
  =============================== */
  const handleDelete = async (id, e) => {
    // 카드 클릭 이벤트(상세 페이지 이동)가 발생하지 않도록 이벤트 전파 중단
    e.stopPropagation();

    const result = await Swal.fire({
      title: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
    });

    if (!result.isConfirmed) return;

    try {
      // 영구 삭제 모드로 API 호출
      await api.delete(`/api/plants/${id}?mode=permanent`);
      await fetchPlants();
      showToast('success', '식물 삭제 완료');
    } catch (error) {
      console.error('삭제 실패:', error);
      Swal.fire('오류', '식물 삭제에 실패했습니다.', 'error');
    }
  };

  // 식물 카드 클릭 시 상세(메뉴) 페이지로 이동하며 식물 데이터 전달
  const handlePlantClick = (plant) => {
    navigate('/menu', { state: { plant } });
  };


  /* ===============================
    UI 렌더링
  =============================== */
  return (
    <div className="profile-container">
      {/* 상단 헤더: 사용자 정보 표시 */}
      <header className="profile-header">
        <div className="user-info-row">
          <FaUserCircle className="user-avatar-icon" />
          <div className="user-text">
            <h2>{user?.nickname || '사용자'}님</h2>
            <p>나의 식물 리스트</p>
          </div>
        </div>
      </header>

      {/* 필터 탭 메뉴 */}
      <div className="profile-tab-menu">
        <button className={currentTab === 'all' ?  'active' : ''}
        onClick={() => setCurrentTab('all')}>전체</button>
      <button className={currentTab === 'alive' ? 'active' : ''}
      onClick={() => setCurrentTab('alive')}>생존</button>
      <button className={currentTab === 'dead' ? 'active' : ''}
      onClick={() => setCurrentTab('dead')}>사망</button>
      </div>

      <hr className="divider" />

      {/* 식물 목록 그리드 */}
      <div className="plant-list-wrapper">
  {loading ? (
    <div className="loading-message">식물 목록을 불러오는 중...</div>
  ) : filteredPlants.length === 0 ? (
    <div className="empty-message">등록된 식물이 없습니다.</div>
  ) : (
    filteredPlants.map((plant) => (
      <div
        key={plant.id}
        // 사망한 식물은 시각적으로 구분하기 위해 dead 클래스 추가
        className={`plant-item solid-item ${plant.status === 'archived' ? 'dead' : ''}`}
        onClick={() => handlePlantClick(plant)}
      >
        {/* 사망 뱃지 표시 */}
        {plant.status === 'archived' && (
          <div className="death-badge">
            {plant.death_reason || '사망'}
          </div>
        )}
        <div className="item-img-box">
          {/* 백엔드 서버 주소를 포함하여 이미지 경로 설정 */}
          <img
            src={`${plant.photo_url}`}
            alt={plant.species}
          />
        </div>

        <div className="item-info">
          <div className="info-top">
            <span className="plant-nickname">{plant.plant_name}</span>
            <span className="plant-name-tag">
              {plant.species}
            </span>
            {plant.status === 'archived' && <span className="dead-icon">☠️</span>}
          </div>
          <div className="info-bottom">
            <FaCalendarAlt /> {plant.reg_date}
          </div>
        </div>

        {/* 수정 및 삭제 버튼 (이벤트 전파 방지 처리됨) */}
        <button
          className="edit-btn-box"
          onClick={(e) => {
            e.stopPropagation();
            setEditingPlant(plant);
          }}>
          <LuPencilLine />
        </button>
        <button
          className="delete-btn-box"
          onClick={(e) => handleDelete(plant.id, e)}>
          <FaTrash />
        </button>
      </div>
    ))
  )}

  {/* 식물 추가 버튼 카드 */}
  <div
    className="plant-item dashed-item"
    onClick={() => setIsModalOpen(true)}
  >
    <div className="add-content">
      <FaPlus className="plus-icon" />
      <span>식물 추가하기</span>
    </div>
  </div>
</div>

      {/* 식물 추가 모달 */}
      {isModalOpen && (
        <AddPlantModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePlant}
        />
      )}

      {/* 식물 수정 모달 */}
      {editingPlant && (
  <EditPlantModal
    plant={editingPlant}
    onClose={() => setEditingPlant(null)}
    onSaved={fetchPlants}
  />
)}
    </div>
  );
}

export default Profile;