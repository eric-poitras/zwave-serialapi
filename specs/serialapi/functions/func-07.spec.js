/* eslint-disable no-unused-expressions */
const { metaSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-07')
metaSpecs(sut, 'getCapabilities', 0x07)
standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '010000860101005afe81ff884f1f0000fb9f7da067000080008086000000e87300000e0000600000',
      expected: {
        applVersion: 1,
        applRevision: 0,
        manufacturerId: 134,
        manufacturerProductType: 257,
        supportedFunctions: [{ funcId: 10 }, { funcId: 12 }, { funcId: 13 }, { funcId: 15 }, { funcId: 18 }, { funcId: 19 }, { funcId: 20 }, { funcId: 21 }, { funcId: 22 }, { funcId: 23 }, { funcId: 24 }, { funcId: 25 }, { funcId: 32 }, { funcId: 33 }, { funcId: 34 }, { funcId: 35 }, { funcId: 36 }, { funcId: 37 }, { funcId: 38 }, { funcId: 39 }, { funcId: 40 }, { funcId: 44 }, { funcId: 48 }, { funcId: 49 }, { funcId: 50 }, { funcId: 51 }, { funcId: 52 }, { funcId: 55 }, { funcId: 57 }, { funcId: 58 }, { funcId: 59 }, { funcId: 60 }, { funcId: 61 }, { funcId: 81 }, { funcId: 82 }, { funcId: 84 }, { funcId: 85 }, { funcId: 86 }, { funcId: 87 }, { funcId: 88 }, { funcId: 89 }, { funcId: 90 }, { funcId: 91 }, { funcId: 92 }, { funcId: 93 }, { funcId: 96 }, { funcId: 97 }, { funcId: 99 }, { funcId: 100 }, { funcId: 101 }, { funcId: 102 }, { funcId: 103 }, { funcId: 110 }, { funcId: 112 }, { funcId: 113 }, { funcId: 114 }, { funcId: 115 }, { funcId: 118 }, { funcId: 119 }, { funcId: 144 }, { funcId: 160 }, { funcId: 162 }, { funcId: 163 }, { funcId: 168 }, { funcId: 196 }, { funcId: 198 }, { funcId: 199 }, { funcId: 200 }, { funcId: 201 }, { funcId: 202 }, { funcId: 205 }, { funcId: 206 }, { funcId: 207 }, { funcId: 226 }, { funcId: 227 }, { funcId: 228 }, { funcId: 254 }, { funcId: 255 }]
      }
    }
  }
})
