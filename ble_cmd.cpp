#include "ble_cmd.h"
#include "water_logic.h"
#include <BLEDevice.h>
#include <BLEServer.h>

#define SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHAR_UUID    "6e400002-b5a3-f393-e0a9-e50e24dcca9e"

class RxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) {
    String cmd = String(c->getValue().c_str());
    cmd.trim();
    cmd.toUpperCase();
    if (cmd.startsWith("WATER "))
      startWaterMl(cmd.substring(6).toFloat());
    if (cmd == "STOP")
      stopWater();
  }
};

void bleInit() {
  BLEDevice::init("ESP32_PUMP");
  BLEServer *s = BLEDevice::createServer();
  BLEService *svc = s->createService(SERVICE_UUID);
  BLECharacteristic *ch =
    svc->createCharacteristic(CHAR_UUID,
      BLECharacteristic::PROPERTY_WRITE);
  ch->setCallbacks(new RxCallbacks());
  svc->start();
  BLEDevice::getAdvertising()->start();
}
