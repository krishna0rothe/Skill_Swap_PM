import EventEmitter from 'eventemitter3'

class NodeLikeEventEmitter extends EventEmitter {
	setMaxListeners() {
		return this
	}

	getMaxListeners() {
		return Number.POSITIVE_INFINITY
	}
}

NodeLikeEventEmitter.defaultMaxListeners = Number.POSITIVE_INFINITY
NodeLikeEventEmitter.EventEmitter = NodeLikeEventEmitter

export { NodeLikeEventEmitter as EventEmitter }
export const defaultMaxListeners = NodeLikeEventEmitter.defaultMaxListeners
export default NodeLikeEventEmitter
