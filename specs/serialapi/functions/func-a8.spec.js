/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-a8')
const { metaSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'applicationCommandHandlerBridge', 0xa8)

standardDecodeCallbackSpecs(sut, {
  success: {
    UZB1: {
      data: '002401029f0400',
      expected: {
        status: {
          routeLocked: false,
          lowPower: false,
          frameType: 'SINGLE',
          foreignFrame: false,
          foreignHome: false
        },
        sourceNodeId: 0x01,
        destNodeId: 0x24,
        command: [0x9f, 0x04],
        multicastNodeIds: []
      }
    }
  }
})
