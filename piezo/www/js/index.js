var PIEZO_SERVICE = '5FA0';
var SWITCH_CHARACTERISTIC = 'FF11';
var LOUDNESS_CHARACTERISTIC = '5FA1';

var app = {
    initialize: function() {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        deviceList.addEventListener('click', this.connect, false);
        refreshButton.addEventListener('click', this.refreshDeviceList, false);
        onButton.addEventListener('click', this.switchOn, false);
        offButton.addEventListener('click', this.switchOff, false);
        //loudness = document.querySelector('#loudness');
        loudness.addEventListener('change', this.setLoudness, false);
        disconnectButton.addEventListener('click', this.disconnect, false);
    },
    onDeviceReady: function() {
        //FastClick.attach(document.body); // https://github.com/ftlabs/fastclick
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empty the list
        ble.scan([PIEZO_SERVICE], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li');
        listItem.innerHTML = device.name + '<br/>' +
            device.id + '<br/>' +
            'RSSI: ' + device.rssi;
        listItem.dataset.deviceId = device.id;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId;
        ble.connect(deviceId, app.onConnect, app.onError);
    },
    onConnect: function(peripheral) {
        app.peripheral = peripheral;
        app.showDetailPage();
    },
    disconnect: function(e) {
        if (app.peripheral && app.peripheral.id) {
            ble.disconnect(app.peripheral.id, app.showMainPage, app.onError);
        }
    },
    switchOn: function() {
        app.setSwitchValue(1);
    },
    switchOff: function() {
        app.setSwitchValue(0);
    },
    setSwitchValue: function(value) {
        var success = function() {
            console.log('Set switch value to ' + value);
        };

        if (app.peripheral && app.peripheral.id) {
            var data = new Uint8Array(1);
            data[0] = value;
            ble.write(
                app.peripheral.id,
                PIEZO_SERVICE,
                SWITCH_CHARACTERISTIC,
                data.buffer,
                success,
                app.onError
            );
        }
    },
    setLoudness: function() {

        var data = new Uint8Array(1);
        data[0] = loudness.value;

        var success = function() {
            console.log('Set loudness to ' + data[0]);
        };

        if (app.peripheral && app.peripheral.id) {
            ble.write(
                app.peripheral.id,
                PIEZO_SERVICE,
                LOUDNESS_CHARACTERISTIC,
                data.buffer,
                success,
                app.onError
            );
        }
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    /*onBackButton: function() {
        if (mainPage.hidden) {
            app.disconnect();
        } else {
            navigator.app.exitApp();
        }
    },*/
    onError: function(reason) {
        navigator.notification.alert(reason, app.showMainPage, 'Error');
    }
};

app.initialize();
