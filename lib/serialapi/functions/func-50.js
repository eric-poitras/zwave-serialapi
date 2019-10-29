const consts = require('../consts')
const { learnModeFormat, learnModeStatusFormat } = require('./formats')
const funcUtils = require('./func-utils')

const name = 'setLearnMode'
const funcId = consts.FUNC_ID_ZW_SET_LEARN_MODE

function encodeRequestData (request, callbackId) {
  const data = []
  data.push(learnModeFormat.parse(request.mode))
  data.push(callbackId)
  return data
}

function decodeCallbackData (reader, result) {
  const callbackId = reader.readByte()
  result.status = reader.readByte(status => learnModeStatusFormat.format(status))
  result.nodeId = reader.readByte()
  result.nodeInfo = reader.readVarBytes()
  return callbackId
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
