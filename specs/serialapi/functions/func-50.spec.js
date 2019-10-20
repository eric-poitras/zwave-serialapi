/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-50')
const { standardEncodeRequestSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')

// serialapi:api ZW->HOST (REQ): {"funcId":80,"data":[2,1,1,0],"callback":{"status":"STARTED","nodeId":1,"nodeInfo":[],"callbackId":2}} +1m
// serialapi:api ZW->HOST (REQ): {"funcId":80,"data":[2,6,34,0],"callback":{"status":"DONE","nodeId":34,"nodeInfo":[],"callbackId":2}} +22s
// serialapi:api ZW->HOST (REQ): {"funcId":4,"data":[0,1,2,32,2],"callback":{"status":{"routeLocked":false,"lowPower":false,"frameType":"SINGLE"},"sourceNodeId":1,"command":[32,2]}} +996ms
// serialapi:api ZW->HOST (REQ): {"funcId":4,"data":[0,1,2,32,2],"callback":{"status":{"routeLocked":false,"lowPower":false,"frameType":"SINGLE"},"sourceNodeId":1,"command":[32,2]}} +35ms
// serialapi:api REQ: {"funcId":80,"data":[0,3],"request":{"mode":"DISABLE"}} +1m

standardEncodeRequestSpecs(sut, {
  success: {
    'Disable Learn Mode': {
      request: {
        mode: 'DISABLE'
      },
      callbackId: 0xaa,
      expected: [0x00, 0xaa]
    },
    'Classic Mode': {
      request: {
        mode: 'CLASSIC'
      },
      callbackId: 0xee,
      expected: [0x01, 0xee]
    },
    'NWI Mode': {
      request: {
        mode: 'NWI'
      },
      callbackId: 0xef,
      expected: [0x02, 0xef]
    },
    'NWE Mode': {
      request: {
        mode: 'NWE'
      },
      callbackId: 0xdd,
      expected: [0x03, 0xdd]
    }

  }
})

standardDecodeCallbackSpecs(sut, {
  success: {
    Started: {
      data: '01015002aabb',
      expected: {
        callbackId: 0x01,
        status: 'STARTED',
        nodeId: 0x50,
        nodeInfo: [0xaa, 0xbb]
      }
    },
    Done: {
      data: 'aa064f05aabb010203',
      expected: {
        callbackId: 0xaa,
        status: 'DONE',
        nodeId: 0x4f,
        nodeInfo: [0xaa, 0xbb, 0x01, 0x02, 0x03]
      }
    },
    Failed: {
      data: 'aa074f05aabb010203',
      expected: {
        callbackId: 0xaa,
        status: 'FAILED',
        nodeId: 0x4f,
        nodeInfo: [0xaa, 0xbb, 0x01, 0x02, 0x03]
      }
    }

  }
})
