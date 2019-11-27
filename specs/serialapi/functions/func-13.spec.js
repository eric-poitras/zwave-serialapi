/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-13')
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'sendData', 0x13)
standardEncodeRequestSpecs(sut, {
  success: {
    'All defaults': {
      request: {
        nodeId: 12,
        command: [1, 2, 3]
      },
      callbackId: 0x01,
      expected: [12, 3, 1, 2, 3, 0x05, 0x01]
    },
    'With no transmit options': {
      request: {
        nodeId: 12,
        command: [4, 5, 6, 7],
        transmitOptions: {}
      },
      callbackId: 0x02,
      expected: [12, 4, 4, 5, 6, 7, 0x00, 0x02]
    },
    'With acknoledge': {
      request: {
        nodeId: 1,
        command: [1, 2, 3],
        transmitOptions: {
          acknoledge: true
        }
      },
      callbackId: 0x03,
      expected: [1, 3, 1, 2, 3, 0x01, 0x03]
    },
    'With lowEnergy': {
      request: {
        nodeId: 1,
        command: [1, 2, 3],
        transmitOptions: {
          lowPower: true
        }
      },
      callbackId: 0x04,
      expected: [1, 3, 1, 2, 3, 0x02, 0x04]
    },
    'With route': {
      request: {
        nodeId: 1,
        command: [1, 2, 3],
        transmitOptions: {
          autoRoute: true
        }
      },
      callbackId: 0x05,
      expected: [1, 3, 1, 2, 3, 0x04, 0x05]
    },
    'With noRoute': {
      request: {
        nodeId: 1,
        command: [1, 2, 3],
        transmitOptions: {
          noRoute: true
        }
      },
      callbackId: 0x06,
      expected: [1, 3, 1, 2, 3, 0x10, 0x06]
    },
    'With explore': {
      request: {
        nodeId: 1,
        command: [1, 2, 3],
        transmitOptions: {
          explore: true
        }
      },
      callbackId: 0x07,
      expected: [1, 3, 1, 2, 3, 0x20, 0x07]
    }

  }
})

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '01',
      expected: {
        success: true
      },
      hasCallback: true
    },
    2: {
      data: '00',
      expected: {
        success: false
      },
      hasCallback: false
    }
  }
})

standardDecodeCallbackSpecs(sut, {
  success: {
    1: {
      data: '01000002',
      callbackId: 0x01,
      expected: {
        txStatus: 'OK'
      }
    }
  }
})
