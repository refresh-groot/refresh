// 배포 환경에서는 같은 도메인의 API를 사용하고, 별도 서버가 필요하면 VITE_API_BASE_URL로 지정합니다.
export const SERVER_URL = import.meta.env.VITE_API_BASE_URL || "";

// 2. 앱 기본 정보
export const APP_NAME = "Refresh";
export const APP_VERSION = "v1.0.0";

// 3. 디자인 시스템
export const MAIN_COLOR = "#26A69A";
export const SUB_COLOR = "#28a745";

// 4. MQTT 토픽 예시
export const MQTT_TOPIC_WATER = "home/plant/water";
