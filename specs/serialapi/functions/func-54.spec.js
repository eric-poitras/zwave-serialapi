/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-54')
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'setSUCNodeId', 0x54)

standardEncodeRequestSpecs(sut, {
  success: {
    AllDefaults: {
      request: { nodeId: 0x20 },
      expected: [0x20, 0x00, 0x00, 0x00]
    },
    setSuc: {
      request: { nodeId: 0x21, SUCState: true },
      expected: [0x21, 0x01, 0x00, 0x00]
    },
    lowPower: {
      request: { nodeId: 0x21, transmitOptions: { lowPower: true } },
      expected: [0x21, 0x00, 0x01, 0x00]
    },
    enableSIS: {
      request: { nodeId: 0x22, enableSIS: true },
      expected: [0x22, 0x00, 0x00, 0x01]
    }
  }
})

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '01',
      expected: { SUCNodeId: 1 }
    }
  },
  noSUC: {
    success: {
      1: {
        data: '00',
        expected: { SUCNodeId: undefined }
      }
    }

  }
})
