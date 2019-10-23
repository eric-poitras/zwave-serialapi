/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-15')
const { standardEncodeRequestSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')

standardEncodeRequestSpecs(sut, {
  success: {
    'No parameters': {
      request: {},
      expected: []
    }

  }
})

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '0102030405060708090a0b0c01',
      expected: {
        version: '\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f',
        libraryType: 'CONTROLLER_STATIC'
      }
    }
  }
})
