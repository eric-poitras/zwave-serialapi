const consts = require('../consts')

const name = 'setDefault'
const funcId = consts.FUNC_ID_ZW_SET_DEFAULT

function encodeRequest (request, callbackId) {
  const params = Buffer.alloc(1)
  params[0] = callbackId
  return { funcId, callbackId, data: [...params], request }
}

function decodeCallback (dataFrame) {
  if (dataFrame.funcId === funcId && dataFrame.type === consts.REQUEST) {
    const data = [...dataFrame.params]
    if (data.length >= 1) {
      const callback = {
        callbackId: data[0]
      }
      return { funcId, data, callback }
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest,
  decodeCallback
}
