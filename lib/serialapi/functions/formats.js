const consts = require('../consts')
const enumfmt = require('../../utils/enumfmt')

const transmitStatusFormat = enumfmt({
  [consts.TRANSMIT_COMPLETE_OK]: 'OK',
  [consts.TRANSMIT_COMPLETE_NO_ACK]: 'NO_ACK',
  [consts.TRANSMIT_COMPLETE_NOROUTE]: 'NO_ROUTE',
  [consts.TRANSMIT_COMPLETE_FAIL]: 'FAIL'
})

const sucUpdateFormat = enumfmt({
  [consts.ZW_SUC_UPDATE_DONE]: 'DONE',
  [consts.ZW_SUC_UPDATE_ABORT]: 'ABORT',
  [consts.ZW_SUC_UPDATE_WAIT]: 'WAIT',
  [consts.ZW_SUC_UPDATE_DISABLED]: 'DISABLED',
  [consts.ZW_SUC_UPDATE_OVERFLOW]: 'OVERFLOW'
})

const frameTypeFormat = enumfmt({
  [consts.RECEIVE_STATUS_TYPE_SINGLE]: 'SINGLE',
  [consts.RECEIVE_STATUS_TYPE_BROAD]: 'BROADCAST',
  [consts.RECEIVE_STATUS_TYPE_MULTI]: 'MULTICAST',
  [consts.RECEIVE_STATUS_TYPE_EXPLORE]: 'EXPLORE'
})

const controllerUpdateStateFormat = enumfmt({
  [consts.UPDATE_STATE_SUC_ID]: 'SUC_ID',
  [consts.UPDATE_STATE_NODE_INFO_RECEIVED]: 'NODE_INFO_RECEIVED',
  [consts.UPDATE_STATE_DELETE_DONE]: 'DELETE_NODE',
  [consts.UPDATE_STATE_NEW_ID_ASSIGNED]: 'NEW_ID_ASSIGNED'
})

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

const learnModeFormat = enumfmt({
  [consts.ZW_SET_LEARN_MODE_DISABLE]: 'DISABLE',
  [consts.ZW_SET_LEARN_MODE_CLASSIC]: 'CLASSIC',
  [consts.ZW_SET_LEARN_MODE_NWI]: 'NWI',
  [consts.ZW_SET_LEARN_MODE_NWE]: 'NWE'
})

const learnModeStatusFormat = enumfmt({
  [consts.LEARN_MODE_STARTED]: 'STARTED',
  [consts.LEARN_MODE_DONE]: 'DONE',
  [consts.LEARN_MODE_FAILED]: 'FAILED'
})

module.exports = {
  transmitStatusFormat,
  sucUpdateFormat,
  frameTypeFormat,
  controllerUpdateStateFormat,
  libraryTypeFormat,
  learnModeFormat,
  learnModeStatusFormat
}
