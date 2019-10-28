const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'applicationCommandHandler'
const funcId = consts.FUNC_ID_APPLICATION_COMMAND_HANDLER

function decodeCallbackData (reader, result) {
  result.status = reader.readByte(rxStatus => funcUtils.decodeRxStatus(rxStatus))
  result.sourceNodeId = reader.readByte()
  result.command = reader.readVarBytes()
}

module.exports = {
  name,
  funcId,
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
