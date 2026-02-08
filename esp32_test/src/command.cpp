#include "command.h"
#include "water_logic.h"
#include "pump.h"

void handleCommand(String cmd) {
    cmd.trim();
    String up = cmd;
    up.toUpperCase();

    if (up == "STOP") {
        pumpOff();
        Serial.println("STOPPED");
        return;
    }

    if (up == "STATUS") {
        printStatus();
        return;
    }

    if (up == "MODE:AUTO") {
        setWateringMode(MODE_AUTO);
        return;
    }

    if (up == "MODE:MANUAL") {
        setWateringMode(MODE_MANUAL);
        return;
    }

    if (up.startsWith("CAL ")) {
        float v = cmd.substring(4).toFloat();
        if (v > 0.1f) {
            ml_per_sec = v;
            Serial.print("CAL SET: ");
            Serial.println(ml_per_sec, 3);
        }
        return;
    }

    if (up.startsWith("WATER ")) {
        float ml = cmd.substring(6).toFloat();
        startWaterMl(ml);
        return;
    }

    Serial.println("ERR: Unknown command");
}