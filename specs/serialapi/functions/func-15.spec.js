/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-15')
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'getVersion', 0x15)

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
    default: {
      data: '0102030405060708090a0b0c01',
      expected: {
        version: '\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f',
        libraryType: 'CONTROLLER_STATIC'
      }
    },
    'aeonlabs z-stick': {
      data: '5a2d5761766520332e39350001',
      expected: {
        version: 'Z-Wave 3.95\u0000',
        libraryType: 'CONTROLLER_STATIC'
      }
    }

  }
})
