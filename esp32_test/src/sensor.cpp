#include "sensor.h"

// [설정] 캘리브레이션 값 (아까 측정한 값)
// 건조할 때(Dry): 2550
// 습할 때(Wet): 955
#define SOIL_DRY_VAL  2550 
#define SOIL_WET_VAL  955

void sensorInit() {
    analogReadResolution(12); // 0~4095
}

int getMoisture() {
    return analogRead(SOIL_PIN);
}

int getMoisturePercent() {
    int raw = getMoisture();

    // 1. 변환 (map 함수는 범위 밖의 값도 계산해버림)
    // 예: 3000이 들어오면 -15%가 됨
    int percent = map(raw, SOIL_DRY_VAL, SOIL_WET_VAL, 0, 100);

    // 2. [안전장치] constrain 함수 (범위 강제 고정)
    // 0보다 작으면 0으로, 100보다 크면 100으로 딱 자름
    percent = constrain(percent, 0, 100);

    return percent;
}