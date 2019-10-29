/* eslint-disable no-unused-expressions */
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-42')
metaSpecs(sut, 'setDefault', 0x42)

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
