import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../app/constants';
// 기본 메뉴화면 카드 4개 관리
export const useSensorData = (plantId, intervalTime = 600000) => {
const [sensorData, setSensorData] = useState({
    temp: 0,
    humid: 0,
    soil: 0,
    light: 0
});
const [loading, setLoading] = useState(true);

const fetchData = async () => {
    if(!plantId) {
        setLoading(false);
        return;
    }
    try {
        const response = await axios.get(`${SERVER_URL}/api/environment-log/${plantId}`);
        const serverData = Array.isArray(response.data) ? response.data[0] : response.data;

    const newData = ({
        temp: serverData?.temperature ?? 0,
        soil: serverData?.moisture_level ?? 0,
        light: serverData?.light_level ?? 0,
        humid: 50
    });

    setSensorData(newData);
        console.log("실시간 데이터 동기화 완료:", newData);
    } catch (error) {
        console.error("데이터 로드 실패:", error);
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, intervalTime); 

    return () => clearInterval(timer);
    }, [plantId, intervalTime]);

    return { sensorData, loading };
};