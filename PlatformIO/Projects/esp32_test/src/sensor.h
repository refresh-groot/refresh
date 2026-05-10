#pragma once
#include <Arduino.h>

void sensorInit();
int getMoisture();        // 기존: 0~4095 Raw 값 / 변환값만 있으면 될 거 같아서 일단 지움
int getMoisturePercent(); // 신규: 0~100% 변환 값