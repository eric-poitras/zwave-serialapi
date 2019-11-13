const consts = require('../consts')

const definitions = [
  require('./func-02'),
  require('./func-04'),
  require('./func-05'),
  require('./func-07'),
  require('./func-13'),
  require('./func-14'),
  require('./func-15'),
  require('./func-16'),
  require('./func-20'),
  require('./func-42'),
  require('./func-49'),
  require('./func-50'),
  require('./func-53'),
  require('./func-54'),
  require('./func-56'),
  require('./func-60'),
  require('./func-61'),
  require('./func-62'),
  require('./func-a8'),
  require('./func-d0')
]

const definitionsById = {}
for (const definition of definitions) {
  const { funcId } = definition
  definitionsById[funcId] = definition
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
  definitions,
  definitionsById,
  processResponse,
  processCallback
}
