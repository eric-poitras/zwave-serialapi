/* eslint-disableno-unused-expressions */
const { metaSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-02')

metaSpecs(sut, 'getInitData', 0x02)
standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '05001d03000000000000000000000000000000000000000000000000000000000500',
      expected: { apiVersion: 5, apiType: 'CONTROLLER', timerSupported: false, controllerType: 'PRIMARY', sis: false, nodes: [{ nodeId: 1 }, { nodeId: 2 }], chipType: 5, chipVersion: 0 }
    }
  }
})
