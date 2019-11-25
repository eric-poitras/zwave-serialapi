const consts = require('./consts')

function buildDefinitionsLookups (definitions) {
  const definitionsById = {}
  for (const definition of definitions) {
    const { funcId } = definition
    definitionsById[funcId] = definition
  }
  return {
    definitions,
    definitionsById
  }
}

function processResponse (funcMeta, frame, callbackId) {
  if (frame.type === consts.RESPONSE) {
    if (funcMeta && typeof funcMeta.decodeResponse === 'function') {
      return funcMeta.decodeResponse(frame, callbackId)
    }
  }
}

function processCallback (funcMeta, frame) {
  if (frame.type === consts.REQUEST) {
    if (funcMeta && typeof funcMeta.decodeCallback === 'function') {
      return funcMeta.decodeCallback(frame)
    }
  }
}
module.exports = {
  buildDefinitionsLookups,
  processCallback,
  processResponse
}
