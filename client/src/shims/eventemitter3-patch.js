import EventEmitter from 'eventemitter3'

if (typeof EventEmitter?.prototype?.setMaxListeners !== 'function') {
  EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
    return this
  }
}

if (typeof EventEmitter?.prototype?.getMaxListeners !== 'function') {
  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return Number.POSITIVE_INFINITY
  }
}
