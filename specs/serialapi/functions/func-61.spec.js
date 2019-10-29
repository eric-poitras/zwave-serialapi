/* eslint-disable no-unused-expressions */
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-61')
metaSpecs(sut, 'removeFailedNode', 0x61)

standardEncodeRequestSpecs(sut, {
  success: {
    1: {
      request: { nodeId: 0x23 },
      callbackId: 0x01,
      expected: [0x23, 0x01]
    }
  }
})

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '01',
      expected: {
        success: true
      }
    },
    2: {
      data: '00',
      expected: {
        success: false
      }
    }
  }

})
