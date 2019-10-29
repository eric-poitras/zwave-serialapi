/* eslint-disable no-unused-expressions */
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-60')
metaSpecs(sut, 'requestNodeInfo', 0x60)

standardEncodeRequestSpecs(sut, {
  success: {
    simple: {
      request: {
        nodeId: 12
      },
      expected: [12]
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
