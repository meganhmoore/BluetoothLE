#include <CurieBLE.h>
#define PIEZO_PIN 6

// create peripheral instance
BLEPeripheral blePeripheral;

// create service
BLEService piezoService = BLEService("5FAO");

// create piezo characteristic
BLEUnsignedCharCharacteristic loudnessCharacteristic = BLEUnsignedCharCharacteristic("5FA1", BLERead | BLEWrite);
BLEDescriptor loudnessDescriptor = BLEDescriptor("2901", "Loudness");
BLECharCharacteristic switchCharacteristic = BLECharCharacteristic("FF11", BLERead | BLEWrite);
BLEDescriptor switchDescriptor = BLEDescriptor("2901", "Switch");

void setup() {
  Serial.begin(9600);

  // set LED pin to output mode
  pinMode(PIEZO_PIN, OUTPUT);

  // set advertised local name and service UUID
  blePeripheral.setLocalName("MeganPiezo");
  blePeripheral.setDeviceName("MeganPiezo");
  blePeripheral.setAdvertisedServiceUuid(piezoService.uuid());

  // add service and characteristics
  blePeripheral.addAttribute(piezoService);
  blePeripheral.addAttribute(loudnessCharacteristic);
  blePeripheral.addAttribute(loudnessDescriptor);
  blePeripheral.addAttribute(switchCharacteristic);
  blePeripheral.addAttribute(switchDescriptor);

  // assign event handlers for characteristic
  loudnessCharacteristic.setEventHandler(BLEWritten, loudnessCharacteristicWritten);
  switchCharacteristic.setEventHandler(BLEWritten, switchCharacteristicWritten);

  // begin initialization
  blePeripheral.begin();

  Serial.println(F("Bluetooth Piezo"));
}

void loop() {
  // Tell the bluetooth radio to do whatever it should be working on  
  blePeripheral.poll();
}

void loudnessCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic) {
  Serial.print(F("Dimmer set to: "));
  Serial.println(loudnessCharacteristic.value());
  analogWrite(PIEZO_PIN, loudnessCharacteristic.value());
  //piezoSong();
}
void switchCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic) {
  // central wrote new value to characteristic, update PIEZO
  Serial.print(F("Characteristic event, written: "));

  if (switchCharacteristic.value()) {
    Serial.println(F("PIEZO on"));
    analogWrite(PIEZO_PIN, 0xFF);
  } else {
    Serial.println(F("PIEZO off"));
    analogWrite(PIEZO_PIN, 0x00);
  }

}


void piezoSong(){
  for(int i=0;i<8;i++){
    analogWrite(PIEZO_PIN, 0);
    delay(250);
    analogWrite(PIEZO_PIN, loudnessCharacteristic.value()-(i*30));
    delay(250);
    analogWrite(PIEZO_PIN, 0);
    delay(250);
    analogWrite(PIEZO_PIN, loudnessCharacteristic.value()-(i*30));
    delay(250);
    analogWrite(PIEZO_PIN, loudnessCharacteristic.value()-(i*30));
  }
  analogWrite(PIEZO_PIN, 0);
}


