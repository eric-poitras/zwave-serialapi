/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-16')
const { standardEncodeRequestSpecs } = require('../../tools/test-frame-codec')

standardEncodeRequestSpecs(sut, {
  success: {
    'No parameters': {
      request: {},
      expected: []
    }
  }
})
