import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaPlus, FaTrashAlt, FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2'
import AddPlantModal from './AddPlantModal';
import axios from 'axios';
import { SERVER_URL } from '../../app/constants';

function Profile() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] =useState(true);

    useEffect(() => {
  if (!user) {
    Swal.fire({
      icon: 'warning',
      title: '로그인 필요',
      text: '로그인 후 이용해주세요.',
      confirmButtonText: '확인'
    }).then(() => {
      navigate('/login');
    });
    return;
  }


  fetchPlants();
}, [user, navigate]);

const fetchPlants = async () => {
  try {
    setLoading(true);
    console.log('요청 URL:', `${SERVER_URL}/api/plants`); // URL 확인
    console.log('인증 쿠키:', document.cookie); // 쿠키 확인
    
    const response = await axios.get('http://223.130.157.123:8080/api/plants');
    
    console.log("서버 응답 데이터: ", response.data);
    
    if (response.data.plants) {
      setPlants(response.data.plants);
    } else if (Array.isArray(response.data)) {
      setPlants(response.data);
    } else {
      setPlants([]);
    }
    
  } catch (error) {
    console.error("식물 불러오기 실패: ", error);
    console.error("에러 상세:", error.response);
    
    if (error.response?.status === 401) {
      Swal.fire({
        icon: 'error',
        title: '인증 실패',
        text: '다시 로그인해주세요.',
        confirmButtonText: '확인'
      }).then(() => {
        navigate('/login');
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: '오류 발생',
        text: error.response?.data?.message || '식물 목록을 불러오는데 실패했습니다.',
        confirmButtonText: '확인'
      });
    }
  } finally {
    setLoading(false);
  }
};

  const handleDelete = (id, e) => {
    e.stopPropagation();
    Swal.fire({
      title: '정말 삭제하시겠습니까?',
      text: "삭제하면 되돌릴 수 없습니다!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '네 삭제합니다',
      cancelButtonText: '취소'
    }).then((result) => {
      if(result.isConfirmed){
        setPlants(plants.filter(plant => plant.id !== id));

        Swal.fire(
          '삭제완료',
          '식물이 리스트에서 삭제되었습니다.',
          'success'
        );
      }
    });
  };

  const handleSavePlant = (newPlant) => {
    setPlants([...plants, newPlant]);

  Swal.fire({
    icon: 'success',
    title: '등록 완료!',
    text: `${newPlant.species} 식물이 추가되었습니다.`,
    timer: 1500,
    showConfirmButton: false
  });
}

const handlePlantClick = (plant) => {
  navigate('/menu', {state: {plant: plant}});
};

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="user-info-row">
          <FaUserCircle className='user-avatar-icon'/>
          <div className="user-text">
            <h2>{user?.nickname || '게스트'}님</h2>
            <p>나의 식물 리스트</p>
          </div>
        </div>
      </header>

    <hr className='divider'/>

    <div className="plant-list-wrapper">
  {loading ? (
    <div className="loading-message">식물 목록을 불러오는 중...</div>
  ) : plants.length === 0 ? (
    <div className="empty-message">등록된 식물이 없습니다.</div>
  ) : (
    plants.map((plant) => (
      <div 
        key={plant.id} 
        className='plant-item solid-item' 
        onClick={() => handlePlantClick(plant)} 
        style={{ cursor: 'pointer' }}>
          <div className="item-img-box">
            <img src={plant.photo_url.startsWith('http') ? plant.photo_url : `${SERVER_URL}${plant.photo_url}`} 
            alt={plant.species} />
          </div>

          <div className="item-info">
            <div className="info-top">
              <span className='plant-nickname'>{plant.plant_name}</span>
              <span className='plant-name-tag'>{plant.species}</span>
            </div>
            <div className="info-bottom">
              <FaCalendarAlt/>{plant.reg_date}
            </div>
          </div>

          <button className='delete-btn-box' onClick={(e) => handleDelete(plant.id, e)}>
            remove
          </button>
        </div>
      )))}

      <div className="plant-item dashed-item" onClick={() => setIsModalOpen(true)}>
        <div className="add-content">
          <FaPlus className='plus-icon'/>
          <span>식물 추가하기</span>
        </div>
      </div>
    </div>

    {isModalOpen && (
      <AddPlantModal
      onClose={()=> setIsModalOpen(false)}
      onSave={handleSavePlant}
      />
    )}

    </div>
  );
}

export default Profile