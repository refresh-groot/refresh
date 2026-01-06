import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaPlus, FaCalendarAlt, FaUserCircle, FaTrash } from 'react-icons/fa';
import { LuPencilLine } from "react-icons/lu";
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import AddPlantModal from './AddPlantModal';
import api from '../../api/axios';

function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     로그인 체크 + 식물 목록 로드
  =============================== */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: '로그인 필요',
        text: '로그인 후 이용해주세요.',
      }).then(() => navigate('/login'));
      return;
    }

    fetchPlants();
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="profile-container">로딩 중...</div>;
  }

  /* ===============================
     식물 목록 조회
  =============================== */
  const fetchPlants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/plants');
      const data = res.data;

      if (Array.isArray(data)) {
        setPlants(data);
      } else if (data?.plants) {
        setPlants(data.plants);
      } else {
        setPlants([]);
      }
    } catch (error) {
      console.error('식물 불러오기 실패:', error);

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
     식물 등록
  =============================== */
  const handleSavePlant = async (nickname, species, date, file) => {
    try {
      const safeSpecies =
        species && species.trim() !== '' ? species : '기타';
      const formData = new FormData();
      formData.append('plant_name', nickname);
      formData.append('species', safeSpecies);
      formData.append('reg_date', date);
      if (file) formData.append('img', file);

      await api.post('/api/plants', formData);

      Swal.fire({
        icon: 'success',
        title: '등록 완료',
        timer: 1200,
        showConfirmButton: false,
      });

      fetchPlants();
    } catch (error) {
      console.error('식물 등록 실패:', error);
      Swal.fire('등록 실패', '식물 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  /* ===============================
     🔥 식물 삭제 (DB 연동)
  =============================== */
  const handleDelete = async (id, e) => {
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
      await api.delete(`/api/plants/${id}?mode=permanent`);
      await fetchPlants();
      Swal.fire('삭제 완료', '식물이 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('삭제 실패:', error);
      Swal.fire('오류', '식물 삭제에 실패했습니다.', 'error');
    }
  };

  const handleEdit = async (id, status, e) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: '식물 정보를 수정하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '수정',
      cancelButtonText: '취소',
    });

    if (!result.isConfirmed) return;

    try {
      await api.edit(`/api/plants/${id}`, {
        status: status,
      });
      await fetchPlants();
      Swal.fire('수정 완료', '식물 상태가 업데이트 되었습니다.', 'success');
    } catch (error) {
      console.error('수정 실패:', error);
      Swal.fire('오류', '식물 상태 업데이트에 실패했습니다.', 'error');
    }
  };

  const handlePlantClick = (plant) => {
    navigate('/menu', { state: { plant } });
  };

  /* ===============================
     렌더링
  =============================== */
  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="user-info-row">
          <FaUserCircle className="user-avatar-icon" />
          <div className="user-text">
            <h2>{user?.nickname || '사용자'}님</h2>
            <p>나의 식물 리스트</p>
          </div>
        </div>
      </header>

      <hr className="divider" />

      <div className="plant-list-wrapper">
        {loading ? (
          <div className="loading-message">식물 목록을 불러오는 중...</div>
        ) : plants.length === 0 ? (
          <div className="empty-message">등록된 식물이 없습니다.</div>
        ) : (
          plants.map((plant) => (
            <div
              key={plant.id}
              className="plant-item solid-item"
              onClick={() => handlePlantClick(plant)}>
              <div className="item-img-box">
                <img src={`http://localhost:8080${plant.photo_url}`}alt={plant.species}/>
              </div>
              
              <div className="item-info">
                <div className="info-top">
                  <span className="plant-nickname">{plant.plant_name}</span>
                  <span className="plant-name-tag">{plant.species}</span>
                </div>
                <div className="info-bottom">
                  <FaCalendarAlt /> {plant.reg_date}
                </div>
              </div>

<button 
className='edit-btn-box'
onClick={(e) => handleEdit(plant.id, plant.status, e)}>
  <LuPencilLine />
  </button>
              <button
                className="delete-btn-box"
                onClick={(e) => handleDelete(plant.id, e)}>
                <FaTrash/>
              </button>
            </div>
          ))
        )}

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

      {isModalOpen && (
        <AddPlantModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePlant}
        />
      )}
    </div>
  );
}

export default Profile;
