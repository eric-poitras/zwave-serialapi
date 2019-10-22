const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')
const funcUtils = require('./func-utils')

const name = 'setLearnMode'
const funcId = consts.FUNC_ID_ZW_SET_LEARN_MODE

const learnModeFormat = enumfmt({
  [consts.ZW_SET_LEARN_MODE_DISABLE]: 'DISABLE',
  [consts.ZW_SET_LEARN_MODE_CLASSIC]: 'CLASSIC',
  [consts.ZW_SET_LEARN_MODE_NWI]: 'NWI',
  [consts.ZW_SET_LEARN_MODE_NWE]: 'NWE'
})

const learnModeStatusFmt = enumfmt({
  [consts.LEARN_MODE_STARTED]: 'STARTED',
  [consts.LEARN_MODE_DONE]: 'DONE',
  [consts.LEARN_MODE_FAILED]: 'FAILED'
})

function encodeRequestData (request, callbackId) {
  const data = []
  data.push(learnModeFormat.parse(request.mode))
  data.push(callbackId)
  return data
}

function decodeCallbackData (data) {
  const result = { funcId, data }

  if (data.length >= 4) {
    const callbackId = data[0]
    const status = data[1]
    const nodeId = data[2]
    const bLen = data[3]
    const nodeInfo = data.slice(4, 4 + bLen)
    return {
      callbackId,
      status: learnModeStatusFmt.format(status),
      nodeId,
      nodeInfo
    }
  }
  return result
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
