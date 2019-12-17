/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-53')
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'requestNetworkUpdate', 0x53)

standardEncodeRequestSpecs(sut, {
  success: {
    Simple: {
      request: {},
      callbackId: 0xaa,
      expected: [0xaa]
    }
  }
})

standardDecodeCallbackSpecs(sut, {
  success: {
    Started: {
      data: '0100',
      callbackId: 0x01,
      expected: {
        status: 'DONE'
      }
    }
  }
})
