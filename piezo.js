var bleno = require('bleno');
var util = require('util');
var switchStatus = 0;
var rangeLevel = 0xFF;

var Characteristic = bleno.Characteristic;
var PrimaryService = bleno.PrimaryService;

var printStatus = function () {
  if (!switchStatus) {
    console.log('Piezo is OFF');
  } else {
    console.log('Piezo is ON. Loudness is', rangeLevel);
  }
};

var SwitchCharacteristic = function () {
  SwitchCharacteristic.super_.call(this, {
    uuid: '5FA1',
    properties: ['read', 'write'],
    descriptors: [
      new bleno.Descriptor({
        uuid: '2901',
        value: 'Switch'
      })
    ]
  });
};
util.inherits(SwitchCharacteristic, Characteristic);

SwitchCharacteristic.prototype.onReadRequest = function (offset, callback) {
  console.log('read request');
  console.log('Piezo is ' + (switchStatus === 0 ? 'OFF' : 'ON'));
  var data = new Buffer(1);
  data[0] = switchStatus;
  callback(this.RESULT_SUCCESS, data);
};

SwitchCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, callback) {
  console.log('write request: ' + data.toString('hex'));
  if (data[0]) {  // anything other than 0
    switchStatus = 1;
    if (rangeLevel === 0) {
      rangeLevel = 0xFF; // TODO notification
    }
  } else {
    switchStatus = 0;
  }
  //console.log('LED is ' + (switchStatus === 0 ? 'OFF' : 'ON'));
  printStatus();
  callback(this.RESULT_SUCCESS);
};

var RangeCharacteristic = function () {
  RangeCharacteristic.super_.call(this, {
    uuid: 'ff11',
    properties: ['read', 'write'],
    descriptors: [
      new bleno.Descriptor({
        uuid: '2901',
        value: 'Range'
      })
    ]
  });
};
util.inherits(RangeCharacteristic, Characteristic);

RangeCharacteristic.prototype.onReadRequest = function (offset, callback) {
  console.log('Read request', this.uuid);
  console.log('Range level is ' + rangeLevel);
  var data = new Buffer(1);
  data[0] = rangeLevel;
  callback(this.RESULT_SUCCESS, data);
};

RangeCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, callback) {
  console.log('write request: ' + data.toString('hex'));
  rangeLevel = data[0];
  if (switchStatus === 0 && rangeLevel > 0) {
    switchStatus = 1; // TODO notification
  } else if (switchStatus === 1 && rangeLevel === 0) {
    switchStatus = 0; // TODO notification
  }
  printStatus();
  callback(this.RESULT_SUCCESS);
};

var piezoService = new PrimaryService({
  uuid: '5FA0',
  characteristics: [
    new SwitchCharacteristic(),
    new RangeCharacteristic()
  ]
});

bleno.on('stateChange', function (state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('Light', [piezoService.uuid]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function (error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([piezoService]);
  }
});
