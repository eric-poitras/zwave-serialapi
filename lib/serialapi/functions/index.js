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

function processResponse (frame) {
  if (frame.type === consts.RESPONSE) {
    const funcMeta = definitionsById[frame.funcId]
    if (funcMeta && typeof funcMeta.decodeResponse === 'function') {
      const response = funcMeta.decodeResponse(frame)
      if (response) {
        return {
          name: funcMeta.name,
          response
        }
      }
    }
  }
}

function processCallback (frame) {
  if (frame.type === consts.REQUEST) {
    const funcMeta = definitionsById[frame.funcId]
    if (funcMeta && typeof funcMeta.decodeCallback === 'function') {
      const request = funcMeta.decodeCallback(frame)
      if (request) {
        return {
          name: funcMeta.name,
          request
        }
      }
    }
  }
}

module.exports = {
  definitions,
  definitionsById,
  processResponse,
  processCallback
}
