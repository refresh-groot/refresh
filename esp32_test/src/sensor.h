#pragma once
#include <Arduino.h>

#define SOIL_PIN 8  // 센서 AOUT이 연결된 GPIO 번호

void sensorInit();
int getMoisture();