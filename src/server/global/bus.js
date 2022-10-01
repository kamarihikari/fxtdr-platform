/**
 * Central Communication Bus
 */

const { BUS_BUFFER_SIZE, DEVELOPER_MODE_HOOK_INTERVAL_SECONDS } = require('./config');
const { ReplaySubject } = require('rxjs');
const { createLogContext } = require('./log');
const EventEmitter = require('events');
const m = require('moment');

const log = createLogContext();

const BUS_EVENT_TYPES = [
  'REGISTER_OBJECT', // adds object to bus registry
  'UNREGISTER_OBJECT', // removes object from bus registry
  'FIND_OBJECT_BY_ID', // Finds an object by id from the map
  'FIND_OBJECT_BY_DATE', // Finds object by timestamp / date
];

// Zones, candles, etc.
const OBJECTS = new Map();
const zones = new Map();
const timeline = new Map();

const bus = new ReplaySubject(BUS_BUFFER_SIZE);
const events = new EventEmitter();

// TODO: REGISTER ALL DEFAULT EVENT LISTENERS


function findObjectOnDate(instrument, timestamp) {
  return timeline.get(`${instrument}_${timestamp}`);
}


// clean up event listeners
function unregisterObject(obj) {
  obj.removeAllListeners();
  return OBJECTS.delete(obj.id);
}

function findObjectById(id, callback) {
  if (id && callback) return callback(OBJECTS.get(id)); 
}


function registerObject(obj) {
  if (!OBJECTS.has(obj.id)) {
    // add event listeners then place into map

    obj.addListener('UNREGISTER_OBJECT', unregisterObject);
    obj.addListener('FIND_OBJECT_BY_ID', findObjectById);

    // Allows objects to send events to the bus directly which will emit to anything listening to the bus
    obj.on('BUS_EVENT', event => events.emit(event));

    // Add object to timeline for future retrieval by date
    timeline.set(`${obj.instrument}_${obj.timestamp}`, obj);

    return OBJECTS.set(obj.id, obj);
  }

  return OBJECTS.get(obj.id);
}



devModeHook(async () => {
  setInterval(function () {
    log.debug(`global objects registered in memory: ${OBJECTS.size}`);
    log.debug(`timeline objects registered in memory: ${timeline.size}`);
  }, DEVELOPER_MODE_HOOK_INTERVAL_SECONDS);
});

module.exports = {
  _objects: OBJECTS,
  _zones: zones,
  registerObject,
  unregisterObject,
  findObjectOnDate,
  emit: events.emit,
  on: events.on
};
