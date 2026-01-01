const { SpeciesInfo } = require('../domain');

const seedSpeciesData = async () => {
  try {
    const data = [
      { species_name: '장미', watering_guide: '토양이 마르면 듬뿍...', env_guide: '햇빛 창가...', mini_tip: '통풍 중요!' },
      { species_name: '난', watering_guide: '주 1회 적당...', env_guide: '반그늘...', mini_tip: '습도 조절!' },
      { species_name: '몬스테라', watering_guide: '겉흙 마를 때...', env_guide: '밝은 그늘...', mini_tip: '지지대 필요!' }
    ];

    // 중복 데이터가 없을 때만 저장 (bulkCreate 사용)
    await SpeciesInfo.bulkCreate(data, { ignoreDuplicates: true });
    console.log('✅ 식물 지식 데이터 주입 성공!');
  } catch (err) {
    console.error('❌ 데이터 주입 실패:', err.message);
  }
};

module.exports = seedSpeciesData;