/* eslint-disable no-unused-expressions */
const { standardEncodeRequestSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-42')

standardEncodeRequestSpecs(sut, {
  success: {
    1: {
      request: {},
      callbackId: 0x01,
      expected: [0x01]
    }
  }
})

standardDecodeCallbackSpecs(sut, {
  success: {
    1: {
      data: '01',
      callbackId: 0x01,
      expected: {}
    }
  }

})
