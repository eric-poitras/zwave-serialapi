/* eslint-disable no-unused-expressions */
const { standardEncodeRequestSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-d0')

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
