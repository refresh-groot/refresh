import React, { useState } from 'react'
import './Profile.css';
import { FaPlus, FaTrashAlt, FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import defaultImg from '../../assets/img/rose.png';
import { showAlert } from '../../app/alert';
import Swal from 'sweetalert2'
import AddPlantModal from './AddPlantModal';

function Profile() {

  const {user} = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plants, setPlants] = useState([
    {
      id: 1,
      name: '장미',
      nickname: '1번',
      startDate: '2024-01-01',
      img: defaultImg
    },
]);

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
    text: `${newPlant.nickname} 식물이 추가되었습니다.`,
    timer: 1500,
    showConfirmButton: false
  });
}

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
      {plants.map((plant) => (
        <div key={plant.id} className='plant-item solid-item'>
          <div className="item-img-box">
            <img src={plant.img} alt={plant.name} />
          </div>

          <div className="item-info">
            <div className="info-top">
              <span className='plant-nickname'>{plant.nickname}</span>
              <span className='plant-name-tag'>{plant.name}</span>
            </div>
            <div className="info-bottom">
              <FaCalendarAlt/>{plant.startDate}
            </div>
          </div>

          <button className='delete-btn-box' onClick={(e) => handleDelete(plant.id, e)}>
            remove
          </button>
        </div>
      ))}

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