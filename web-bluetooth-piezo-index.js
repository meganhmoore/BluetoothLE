document.querySelector('#startButton').addEventListener('click', function(event) {
    event.stopPropagation();
    event.preventDefault();

    if (isWebBluetoothEnabled()) {
        ChromeSamples.clearLog();
        onStartButtonClick();
    }
});

var bluetoothDevice;
var powerSwitchCharateristic;
var loudnessCharacteristic;
var log = ChromeSamples.log;

document.querySelector('#controlsDiv').hidden = true;

document.querySelector('#loudness').addEventListener('change', onLoudnessChange);
document.querySelector('#powerswitch').addEventListener('click', onPowerSwitchChange);
document.querySelector('#disconnectButton').addEventListener('click', disconnect);

function onLoudnessChange(event) {
  let loudness = event.target.value;
  loudnessCharacteristic.writeValue(new Uint8Array([loudness]));
  // Sync the UI (notification from peripheral would be better)
  if (loudness === "0") {
    powerswitch.checked = false;
  } else if (!powerswitch.checked) {
    powerswitch.checked = true;
  }
}

function onPowerSwitchChange(event) {
  let checked = event.target.checked;

  if (checked) {
    powerSwitchCharateristic.writeValue(new Uint8Array([1]));
    loudness.value = 0x30;
  } else {
    powerSwitchCharateristic.writeValue(new Uint8Array([0]));
  }
}

function onStartButtonClick() {
  let serviceUuid = BluetoothUUID.getCharacteristic(0x5FA0);
  let powerSwitchCharateristicUuid = BluetoothUUID.getCharacteristic(0xFF11);
  let loudnessCharacteristicUuid = BluetoothUUID.getCharacteristic(0x5FA1);

  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}]})
  .then(device => {
    bluetoothDevice = device; // save a copy
    document.querySelector('#startButton').hidden = true;
    document.querySelector('#controlsDiv').hidden = false;
    // hide loudness until we know the peripheral supports 0xff12
    loudness.hidden = true;
    loudness.labels[0].style.display = 'none';

    log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
  .then(server => {
    log('Getting Service...');
    return server.getPrimaryService(serviceUuid);
  })
  .then(service => {
    log('Getting Characteristic...');
    return service.getCharacteristics();
  })
  .then(characteristics => {

    // save references to the characteristics we care about
    characteristics.forEach(c => {

      switch(c.uuid) {
        case loudnessCharacteristicUuid:
          log('Loudness Characteristic');
          loudnessCharacteristic = c;
          loudnessCharacteristic.readValue().then(updateLoudnessSlider);
          // show the loudness control and label
          loudness.hidden = false;
          loudness.labels[0].style.display = '';
          break;

        case powerSwitchCharateristicUuid:
          log('Power Switch Characteristic');
          powerSwitchCharateristic = c;
          powerSwitchCharateristic.readValue().then(updatePowerSwitch);
          break;

        default:
          log('Skipping ' + c.uuid);
      }
    });
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function updateLoudnessSlider(value) {
  document.querySelector('#loudness').value = value.getUint8(0);
}

function updatePowerSwitch(value) {
  // expecting DataView with uint8: 1 for on, 0 for off
  document.querySelector('#powerswitch').checked = value.getUint8(0);
}

function powerSwitchCharacteristicChanged(event) {
  let value = event.target.value;
  console.log('Power Switch Value Changed', value.getUint8(0));
  updatePowerSwitch(value);
}

function disconnect() {
  if (bluetoothDevice && bluetoothDevice.gatt) {
    bluetoothDevice.gatt.disconnect();
  }
  document.querySelector('#startButton').hidden = false;
  document.querySelector('#controlsDiv').hidden = true;
}
