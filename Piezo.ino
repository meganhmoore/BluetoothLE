#include <CurieBLE.h>
#define PIEZO_PIN 6

// create peripheral instance
BLEPeripheral blePeripheral;

// create service
BLEService piezoService = BLEService("FF10");

// create switch and dimmer characteristic
BLEUnsignedCharCharacteristic piezoSongCharacteristic = BLEUnsignedCharCharacteristic("FF11", BLERead | BLEWrite);
BLEDescriptor piezoSongDescriptor = BLEDescriptor("2901", "Dimmer");

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
  blePeripheral.addAttribute(piezoSongCharacteristic);
  blePeripheral.addAttribute(piezoSongDescriptor);

  // assign event handlers for characteristic
  piezoSongCharacteristic.setEventHandler(BLEWritten, piezoSongCharacteristicWritten);

  // begin initialization
  blePeripheral.begin();

  Serial.println(F("Bluetooth Piezo"));
}

void loop() {
  // Tell the bluetooth radio to do whatever it should be working on  
  blePeripheral.poll();
}

void piezoSongCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic) {
  Serial.print(F("Dimmer set to: "));
  Serial.println(piezoSongCharacteristic.value());
  analogWrite(PIEZO_PIN, piezoSongCharacteristic.value());
  piezoSong(central);
}

void piezoSong(BLECentral& central){
  for(int i=0;i<8;i++){
    analogWrite(PIEZO_PIN, 0);
    delay(250);
    analogWrite(PIEZO_PIN, piezoSongCharacteristic.value()-(i*30));
    delay(250);
    analogWrite(PIEZO_PIN, 0);
    delay(250);
    analogWrite(PIEZO_PIN, piezoSongCharacteristic.value()-(i*30));
    delay(250);
    analogWrite(PIEZO_PIN, piezoSongCharacteristic.value()-(i*30));
  }
  analogWrite(PIEZO_PIN, 0);
}


