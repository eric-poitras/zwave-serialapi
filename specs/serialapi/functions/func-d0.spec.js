/* eslint-disable no-unused-expressions */
const { metaSpecs, standardEncodeRequestSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-d0')
metaSpecs(sut, 'setPromiscuousMode', 0xd0)

standardEncodeRequestSpecs(sut, {
  success: {
    enabled: {
      request: { enabled: true },
      expected: [0x01]
    },
    disabled: {
      request: { enabled: false },
      expected: [0x00]
    }
  }
})
