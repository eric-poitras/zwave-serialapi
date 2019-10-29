/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-16')
const { metaSpecs, standardEncodeRequestSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'sendDataAbort', 0x16)

standardEncodeRequestSpecs(sut, {
  success: {
    'No parameters': {
      request: {},
      expected: []
    }
  }
})
