import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../app/constants';
// 기본 메뉴화면 카드 4개 관리
export const useSensorData = (plantId, intervalTime = 90000) => {
const [sensorData, setSensorData] = useState({
    temp: null,
    humid: null,
    soil: null,
    light: null
});
const [loading, setLoading] = useState(true);
const [fetchedAt, setFetchedAt] = useState(null);
const [error, setError] = useState(false);

 const fetchData = useCallback(async () => {
    if(!plantId) {
        setLoading(false);
        return;
    }
    try {
        setError(false);
        const response = await axios.get(`${SERVER_URL}/api/environment-log/${plantId}`);
        const serverData = Array.isArray(response.data) ? response.data[0] : response.data;

    const newData = ({
        temp: serverData?.temperature ?? null,
        soil: serverData?.moisture_level ?? null,
        light: serverData?.light_level ?? null,
        humid: serverData?.humidity ?? null
    });
    
    setSensorData(newData);
    setFetchedAt(Date.now());
    } catch (error) {
        console.error("데이터 로드 실패:", error);
        setError(true);
    } finally {
        setLoading(false);
    }
    }, [plantId]);

    useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, intervalTime); 

    return () => clearInterval(timer);
    }, [fetchData, intervalTime]);

    return { sensorData, loading, error, fetchData, fetchedAt };
};
