#include "sensor.h"

void sensorInit() {
    analogReadResolution(12); // ESP32-S3 0~4095 범위 설정
}

int getMoisture() {
    return analogRead(SOIL_PIN);
}