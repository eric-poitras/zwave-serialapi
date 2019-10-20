/* eslint-disable no-unused-expressions */
const { standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-60')

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '01',
      expected: {
        success: true
      }
    },
    2: {
      data: '00',
      expected: {
        success: false
      }
    }
  }

})
