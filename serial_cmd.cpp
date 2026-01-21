#include "serial_cmd.h"
#include "water_logic.h"

static String line;

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      String cmd = line;
      line = "";
      cmd.trim();
      cmd.toUpperCase();

      if (cmd == "STOP") stopWater();
      else if (cmd == "STATUS") printStatus();
      else if (cmd.startsWith("CAL ")) {
        ml_per_sec = cmd.substring(4).toFloat();
        Serial.println("CAL SET");
      }
      else if (cmd.startsWith("WATER ")) {
        startWaterMl(cmd.substring(6).toFloat());
      }
      else {
        Serial.println("ERR: Unknown command");
      }
    } else {
      line += c;
    }
  }
}
