const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')
const funcUtils = require('./func-utils')

const name = 'getVersion'
const funcId = consts.FUNC_ID_ZW_GET_VERSION

const libraryTypeFormat = enumfmt({
  [consts.ZW_LIB_CONTROLLER_STATIC]: 'CONTROLLER_STATIC',
  [consts.ZW_LIB_CONTROLLER]: 'CONTROLLER',
  [consts.ZW_LIB_SLAVE_ENHANCED]: 'SLAVE_ENHANCED',
  [consts.ZW_LIB_SLAVE]: 'SLAVE',
  [consts.ZW_LIB_INSTALLER]: 'INSTALLER',
  [consts.ZW_LIB_SLAVE_ROUTING]: 'SLAVE_ROUTING',
  [consts.ZW_LIB_CONTROLLER_BRIDGE]: 'CONTROLLER_BRIDGE',
  [consts.ZW_LIB_DUT]: 'DUT',
  [consts.ZW_LIB_AVREMOTE]: 'AVREMOTE',
  [consts.ZW_LIB_AVDEVICE]: 'AVDEVICE'
})

function decodeResponseData (data) {
  if (data.length >= 13) {
    return {
      version: Buffer.from(data.slice(0, 12)).toString('ascii'),
      libraryType: libraryTypeFormat.format(data[12])
    }
  }
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
