#include <Arduino.h>
#include "pump.h"
#include "water_logic.h"
#include "serial_cmd.h"
#include "ble_cmd.h"

void setup() {
  Serial.begin(115200);
  delay(1500);

  pumpInit();
  bleInit();

  Serial.println("Ready.");
  Serial.println("Commands: WATER <mL>, STOP, STATUS, CAL <mLps>");
}

void loop() {
  waterLoop();
  handleSerial();
}
