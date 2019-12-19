const createSerialApi = require('./serialapi')

function createController (params) {
  const serialApi = createSerialApi(params)
}

module.exports = createController
