const consts = require('../consts')
const funcUtils = require('./func-utils')

const name = 'applicationCommandHandlerBridge'
const funcId = consts.FUNC_ID_APPLICATION_COMMAND_HANDLER_BRIDGE

function decodeCallbackData (reader, result) {
  reader.readByte(rxStatus => { result.status = funcUtils.decodeRxStatus(rxStatus) })
  reader.readByte(destNodeId => { result.destNodeId = destNodeId })
  reader.readByte(sourceNodeId => { result.sourceNodeId = sourceNodeId })
  reader.readVarBytes(command => { result.command = command })
  reader.readVarBytes(multicastNodeMask => { result.multicastNodeIds = multicastNodeMask })
}

module.exports = {
  name,
  funcId,
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
