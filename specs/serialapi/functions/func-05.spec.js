/* eslint-disable no-unused-expressions */
const { standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-05')

standardDecodeResponseSpecs(sut, {
  success: {
    isSecondary: {
      data: '01',
      expected: {
        isSecondary: true,
        isSuc: false,
        isOnOtherNetwork: false,
        nodeIdServerPresent: false,
        isRealPrimary: false
      }
    },
    isSuc: {
      data: '10',
      expected: {
        isSecondary: false,
        isSuc: true,
        isOnOtherNetwork: false,
        nodeIdServerPresent: false,
        isRealPrimary: false
      }
    },
    isOnOtherNetwork: {
      data: '02',
      expected: {
        isSecondary: false,
        isSuc: false,
        isOnOtherNetwork: true,
        nodeIdServerPresent: false,
        isRealPrimary: false
      }
    },
    nodeIdServerPresent: {
      data: '04',
      expected: {
        isSecondary: false,
        isSuc: false,
        isOnOtherNetwork: false,
        nodeIdServerPresent: true,
        isRealPrimary: false
      }
    },
    isRealPrimary: {
      data: '08',
      expected: {
        isSecondary: false,
        isSuc: false,
        isOnOtherNetwork: false,
        nodeIdServerPresent: false,
        isRealPrimary: true
      }
    }

  }
})
