#include "serial_cmd.h"
#include "command.h"

static String line;

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      handleCommand(line);
      line = "";
    } else {
      line += c;
    }
  }
}