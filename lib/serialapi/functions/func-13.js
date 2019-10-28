const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')
const funcUtils = require('./func-utils')

const name = 'sendData'
const funcId = consts.FUNC_ID_ZW_SEND_DATA

const transmitStatusFormat = enumfmt({
  [consts.TRANSMIT_COMPLETE_OK]: 'OK',
  [consts.TRANSMIT_COMPLETE_NO_ACK]: 'NO_ACK',
  [consts.TRANSMIT_COMPLETE_NOROUTE]: 'NO_ROUTE',
  [consts.TRANSMIT_COMPLETE_FAIL]: 'FAIL'
})

function encodeTransmitOptions (options) {
  let result = 0x00
  if (options.acknoledge) result |= consts.TRANSMIT_OPTION_ACK
  if (options.lowPower) result |= consts.TRANSMIT_OPTION_LOW_POWER
  if (options.autoRoute) result |= consts.TRANSMIT_OPTION_AUTO_ROUTE
  if (options.noRoute) result |= consts.TRANSMIT_OPTION_NO_ROUTE
  if (options.explore) result |= consts.TRANSMIT_OPTION_EXPLORE
  return result
}

function encodeRequestData (request, callbackId) {
  const transmitOptions = request.transmitOptions || {
    acknoledge: true,
    lowPower: false,
    autoRoute: true,
    explore: false
  }

  const data = []
  const command = request.command

  data.push(request.nodeId)
  data.push(command.length)
  data.push(...command)
  data.push(encodeTransmitOptions(transmitOptions))
  data.push(callbackId)

  return data
}

function decodeCallbackData (reader, result) {
  const callbackId = reader.readByte()
  result.txStatus = reader.readByte(transmitStatus => transmitStatusFormat.format(transmitStatus))
  return callbackId
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildRequestEncoder(funcId, encodeRequestData),
  decodeResponse: funcUtils.buildBooleanResponseDecoder(funcId),
  decodeCallback: funcUtils.buildCallbackDecoder(funcId, decodeCallbackData)
}
