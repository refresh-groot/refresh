import { useState, useEffect } from 'react';
// 기본 메뉴화면 카드 4개 관리
export const useSensorData = (intervalTime = 5000) => {
const [sensorData, setSensorData] = useState({
    temp: 0,
    humid: 0,
    soil: 0,
    light: 0
});
const [loading, setLoading] = useState(true);

const fetchData = async () => {
    try {
    const mockData = {
        temp: (Math.random() * 2 + 23).toFixed(1),
        humid: Math.floor(Math.random() * 10 + 50), 
        soil: Math.floor(Math.random() * 20 + 30), 
        light: Math.floor(Math.random() * 100 + 700)
    };

    setSensorData(mockData);
        console.log("실시간 데이터 동기화 완료:", mockData);
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
    }, [intervalTime]);

    return { sensorData, loading };
};