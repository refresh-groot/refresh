#include "ble_cmd.h"
#include "water_logic.h"
#include "command.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <Preferences.h>

#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define RX_CHAR_UUID           "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define TX_CHAR_UUID           "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // [추가] 답장용 ID

Preferences preferences;
BLECharacteristic *pTxCharacteristic; // [추가] 답장을 보낼 통로 객체

class RxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) {
    String cmd = String(c->getValue().c_str());
    cmd.trim();

    if (cmd.startsWith("WIFI:")) {
      int commaIndex = cmd.indexOf(',');
      if (commaIndex != -1) {
        String ssid = cmd.substring(5, commaIndex);
        String pass = cmd.substring(commaIndex + 1);

        preferences.begin("wifi-info", false);
        preferences.putString("ssid", ssid);
        preferences.putString("pass", pass);
        preferences.end();

        Serial.println("WiFi Info Saved! Restarting...");
        delay(2000);
        ESP.restart();
      }
    } else {
        handleCommand(cmd); // WATER, MODE 등 명령 처리
    }
  }
};

void bleInit() {
  BLEDevice::init("ESP32_PUMP");
  BLEServer *s = BLEDevice::createServer();
  BLEService *svc = s->createService(SERVICE_UUID);

  // 1. [RX] 받는 통로 설정 (아이폰 -> ESP32)
  BLECharacteristic *pRxChar = svc->createCharacteristic(
                                 RX_CHAR_UUID,
                                 BLECharacteristic::PROPERTY_WRITE
                               );
  pRxChar->setCallbacks(new RxCallbacks());

  // 2. [TX] 보내는 통로 설정 (ESP32 -> 아이폰) - [추가됨]
  pTxCharacteristic = svc->createCharacteristic(
                        TX_CHAR_UUID,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );

  svc->start();
  BLEDevice::getAdvertising()->start();
  Serial.println("BLE Ready with TX/RX");
}