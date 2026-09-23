// Waste2Value sensor node prototype
// Libraries: OneWire, DallasTemperature, Adafruit INA219
// Install these from Arduino Library Manager.

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_INA219.h>

#define ONE_WIRE_BUS 4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
Adafruit_INA219 ina219;

void setup() {
  Serial.begin(115200);
  sensors.begin();
  ina219.begin();
}

void loop() {
  sensors.requestTemperatures();
  float hotTemp = sensors.getTempCByIndex(0);
  float coldTemp = sensors.getTempCByIndex(1);
  float voltage = ina219.getBusVoltage_V();
  float current = ina219.getCurrent_mA();
  float power = voltage * current;

  // CSV: hot,cold,voltage,current_mA,power_mW
  Serial.printf("%.2f,%.2f,%.3f,%.2f,%.2f\n", hotTemp, coldTemp, voltage, current, power);
  delay(2000);
}
