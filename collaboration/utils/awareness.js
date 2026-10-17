const {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates
} = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');

const MESSAGE_AWARENESS = 1;

/**
 * Create a new Yjs Awareness instance for a Y.Doc
 * @param {import('yjs').Doc} ydoc
 * @returns {Awareness}
 */
function createAwareness(ydoc) {
  return new Awareness(ydoc);
}

/**
 * Apply an incoming awareness update to the Awareness instance
 * @param {Awareness} awareness
 * @param {Uint8Array|Buffer} update
 * @param {any} origin
 */
function handleAwarenessUpdate(awareness, update, origin) {
  const uint8 = update instanceof Uint8Array ? update : new Uint8Array(update);
  applyAwarenessUpdate(awareness, uint8, origin);
}

/**
 * Encode awareness states for specified client IDs
 * @param {Awareness} awareness
 * @param {number[]} clientIds
 * @returns {Uint8Array}
 */
function encodeAwareness(awareness, clientIds) {
  return encodeAwarenessUpdate(awareness, clientIds);
}

/**
 * Create a WebSocket-ready binary message for awareness updates
 * [MESSAGE_AWARENESS, awarenessUpdate]
 * @param {Awareness} awareness
 * @param {number[]} clientIds
 * @returns {Uint8Array}
 */
function createAwarenessMessage(awareness, clientIds) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, clientIds));
  return encoding.toUint8Array(encoder);
}

/**
 * Read awareness update from decoder
 * @param {import('lib0/decoding').Decoder} decoder
 * @returns {Uint8Array}
 */
function readAwarenessUpdate(decoder) {
  return decoding.readVarUint8Array(decoder);
}

/**
 * Remove client awareness states on disconnection
 * @param {Awareness} awareness
 * @param {number[]} clientIds
 * @param {any} origin
 */
function removeClientStates(awareness, clientIds, origin = null) {
  if (!clientIds || clientIds.length === 0) return;
  removeAwarenessStates(awareness, clientIds, origin);
}

module.exports = {
  MESSAGE_AWARENESS,
  createAwareness,
  handleAwarenessUpdate,
  encodeAwareness,
  createAwarenessMessage,
  readAwarenessUpdate,
  removeClientStates
};
