/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-04')
const { standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')

standardDecodeCallbackSpecs(sut, {
  success: {
    SINGLE: {
      data: '0003032003ff',
      expected: {
        status: {
          routeLocked: false,
          lowPower: false,
          foreignFrame: false,
          foreignHome: false,
          frameType: 'SINGLE'
        },
        sourceNodeId: 0x03,
        command: [0x20, 0x03, 0xff]
      }
    },
    BROADCAST: {
      data: '048703200102',
      expected: {
        status: {
          routeLocked: false,
          lowPower: false,
          foreignFrame: false,
          foreignHome: false,
          frameType: 'BROADCAST'
        },
        sourceNodeId: 0x87,
        command: [0x20, 0x01, 0x02]
      }
    },
    MULTICAST: {
      data: '0801022001',
      expected: {
        status: {
          routeLocked: false,
          lowPower: false,
          foreignFrame: false,
          foreignHome: false,
          frameType: 'MULTICAST'
        },
        sourceNodeId: 0x01,
        command: [0x20, 0x01]
      }
    },
    EXPLORE: {
      data: '100100',
      expected: {
        status: {
          routeLocked: false,
          lowPower: false,
          foreignFrame: false,
          foreignHome: false,
          frameType: 'EXPLORE'
        },
        sourceNodeId: 0x01,
        command: []
      }
    }
  }
})
