/* eslint-disableno-unused-expressions */
const { metaSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-56')
metaSpecs(sut, 'getSUCNodeId', 0x56)

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
