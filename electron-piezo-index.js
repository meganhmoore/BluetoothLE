var noble = require('noble');

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning(['5FA0']);
    } else {
        noble.stopScanning();
        alert('Please enable Bluetooth');
    }
});

noble.on('discover', function(peripheral) {

    console.log(peripheral);
    new Notification('Bluetooth Piezo', {body: 'connecting to ' + peripheral.advertisement.localName });
    connectAndSetUp(peripheral);

    // Use this version in class to limit which devices you connect to
    // if (peripheral.advertisement.localName === 'LED') {
    //     console.log(peripheral);
    //     new Notification('Bluetooth LED', {body: 'connecting to ' + peripheral.advertisement.localName, silent: true });
    //     connectAndSetUp(peripheral);
    //     noble.stopScanning();
    // } else {
    //     console.log('Skipping ' + peripheral.advertisement.localName);
    // }
});

function connectAndSetUp(peripheral) {

    peripheral.connect(function(error) {

        var serviceUUIDs = ['5FA0'];
        var characteristicUUIDs = ['ff11', '5FA1']; // switch, dimmer

        peripheral.discoverSomeServicesAndCharacteristics(
            serviceUUIDs,
            characteristicUUIDs,
            onServicesAndCharacteristicsDiscovered);
    });

    // attach disconnect handler
    peripheral.on('disconnect', onDisconnect);
}

function onDisconnect() {
    alert('Peripheral disconnected.');
    console.log('Peripheral disconnected!');
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {

    if (error) {
        console.log('Error discovering services and characteristics ' + error);
        return;
    }

    var switchCharacteristic = characteristics[0];
    // TODO handle peripherals without ff12
    var loudnessCharacteristic = characteristics[1];

    function sendData(byte) {
        var buffer = new Buffer(1);
        buffer[0] = byte;
        switchCharacteristic.write(buffer, false, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("wrote " + byte);
            }
        });
    }

    function on() {
        sendData(0x30);
    }

    function off() {
        sendData(0x00);
    }

    function setLoudness() {

        if (!loudnessCharacteristic) {
            return;
        }
        var buffer = new Buffer([loudness.value]);

        loudnessCharacteristic.write(buffer, false, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log('Set loudness to ' + buffer[0]);
            }
        });
    }

    if (loudnessCharacteristic) {
        loudnessCharacteristic.on('data', function(data, isNotification) {
            loudness.value = data.readUInt8(0);
        });
    }

    onButton.addEventListener('click', on, false);
    offButton.addEventListener('click', off, false);
    loudness.addEventListener('change', setLoudness, false);

    if (loudnessCharacteristic) {
        loudnessCharacteristic.read();
    }

}
