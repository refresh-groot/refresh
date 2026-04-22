#include "ble_cmd.h"
#include "water_logic.h"
#include "command.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>      // 추가
#include <Preferences.h>
#include <WiFi.h> // MAC 주소로 esp32 늘릴라고 추가

#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define RX_CHAR_UUID           "6e400002-b5a3-f393-e0a9-e50e24dcca9e" //추후 앱이 명령 보냄
#define TX_CHAR_UUID           "6e400003-b5a3-f393-e0a9-e50e24dcca9e" //추후 앱이 답장 기다림

Preferences preferences; //세이브 공간 (아이디,비번)
BLECharacteristic *pTxCharacteristic; // 답장용 통로를 담을 변수

// [추가] 연결 상태를 감시하는 콜백 클래스
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        Serial.println(">>> 블루투스 연결됨!");
    }

    void onDisconnect(BLEServer* pServer) {
        Serial.println(">>> 연결 끊김! 다시 신호를 뿌립니다.");
        // 연결이 끊기면 다시 주변 기기들이 찾을 수 있게 광고를 시작함
        BLEDevice::startAdvertising(); // 수정: pServer-> 대신 BLEDevice::
    }
};

//수신
class RxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) {
    // 1. 받은 데이터를 문자열로 변환하고 앞뒤 공백 제거
    String cmd = String(c->getValue().c_str()); 
    cmd.trim();

    // 2. 와이파이 설정 모드
    if (cmd.startsWith("WIFI:")) { //와이파이로 시작하면
      int commaIndex = cmd.indexOf(','); // 쉼표가 어디 있는지
      if (commaIndex != -1) { //쉼표가 있다면
        String ssid = cmd.substring(5, commaIndex); //와이파이 다음 쉼표 전까지
        String pass = cmd.substring(commaIndex + 1); //쉼표 다음부터

        // 아이디 비번 세이브에 저장
        preferences.begin("wifi-info", false);
        preferences.putString("ssid", ssid);
        preferences.putString("pass", pass);
        preferences.end();

        Serial.println("WiFi Info Saved! Restarting...");
        delay(2000);
        ESP.restart();
      }
    } else {
        handleCommand(cmd); // command.cpp로 보냄
    }
  }
};

void bleInit() {
  // 1. 기기의 고유 MAC 주소를 읽어옵니다 (예: AA:BB:CC:DD:EE:FF)
  String mac = WiFi.macAddress();
  
  // 2. MAC 주소의 뒷자리 4개를 추출해서 이름을 만듭니다. (예: ESP32_PUMP_EEFF)
  // substring(12, 14)는 "EE", substring(15, 17)은 "FF"를 의미합니다.
  String deviceName = "ESP32_PUMP_" + mac.substring(12, 14) + mac.substring(15, 17);

  // 3. 고정된 이름 대신, 생성한 고유 이름으로 블루투스를 초기화합니다.
  BLEDevice::init(deviceName.c_str()); 
  
  Serial.print("블루투스 이름 설정 완료: ");
  Serial.println(deviceName);

  BLEServer *s = BLEDevice::createServer(); 
  s->setCallbacks(new MyServerCallbacks()); 

  BLEService *svc = s->createService(SERVICE_UUID);

  // 1. [RX] 받는 통로 설정
  BLECharacteristic *pRxChar = svc->createCharacteristic(
                                 RX_CHAR_UUID,
                                 BLECharacteristic::PROPERTY_WRITE
                               );
  pRxChar->setCallbacks(new RxCallbacks());

  // 2. [TX] 보내는 통로 설정
  pTxCharacteristic = svc->createCharacteristic(
                        TX_CHAR_UUID,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  
  pTxCharacteristic->addDescriptor(new BLE2902()); // 추가
  svc->start();
  
  // 4. [보완] 광고 데이터에 서비스 UUID를 포함하여 앱이 더 잘 찾도록 설정
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  
  pAdvertising->start();
  Serial.println("BLE Ready with Unique Name & Auto-Restart");
}