#include "dht_sensor.h"
#include <DHT.h>

#define DHT_PIN 9      // 온습도 센서 out이 연결된 GPIO 9번 핀
#define DHT_TYPE DHT11 // 센서 모델 (DHT11 기준, 만약 DHT22면 DHT22로 수정)

DHT dht(DHT_PIN, DHT_TYPE);

void dhtInit() {
    dht.begin();
}

float getTemperature() {
    float t = dht.readTemperature();
    if (isnan(t)) {
        Serial.println("ERR: DHT 온도 읽기 실패");
        return 0.0f; // 에러 발생 시 시스템 오작동 방지용 안전장치
    }
    return t;
}

float getHumidity() {
    float h = dht.readHumidity();
    if (isnan(h)) {
        Serial.println("ERR: DHT 습도 읽기 실패");
        return 0.0f; // 에러 발생 시 시스템 오작동 방지용 안전장치
    }
    return h;
}