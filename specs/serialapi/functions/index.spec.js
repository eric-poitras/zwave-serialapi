/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const sinon = require('sinon')
const consts = require('../../../lib/serialapi/consts')
const functions = require('../../../lib/serialapi/functions')

describe('functions (index.js)', () => {
  describe('processCallback', () => {
    const sut = functions.processCallback

    it('should decode request frame with matching decoder', () => {
      const decodeCallback = sinon.mock().returns(42)
      const funcMeta = {
        decodeCallback
      }
      const frame = {
        type: consts.REQUEST,
        funcId: 0x02
      }
      const res = sut(funcMeta, frame)
      expect(decodeCallback.withArgs(frame).calledOnce).to.be.true
      expect(res).to.be.deep.equal(42)
    })

    it('should not decode request frame with no decoder', () => {
      const decodeCallback = sinon.mock().returns(undefined)
      const funcMeta = {
        decodeCallback
      }
      const frame = {
        type: consts.REQUEST,
        funcId: 0x00
      }
      const res = sut(funcMeta, frame)
      expect(decodeCallback.calledOnce).to.be.true
      expect(res).to.be.undefined
    })

    it('should not decode response frame', () => {
      const decodeCallback = sinon.mock().returns(42)
      const funcMeta = {
        decodeCallback
      }
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x02
      }
      const res = sut(funcMeta, frame)
      expect(decodeCallback.notCalled).to.be.true
      expect(res).to.be.undefined
    })
  })

  describe('decodeResponseFrame', () => {
    const sut = functions.processResponse

    it('should decode response frame with matching decoder', () => {
      const decodeResponse = sinon.mock().returns(42)
      const funcMeta = {
        decodeResponse
      }
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x02
      }
      const res = sut(funcMeta, frame)
      expect(decodeResponse.calledOnce).to.be.true
      expect(res).to.be.deep.equal(42)
    })

    it('should node decode response frame with no decoder', () => {
      const decodeResponse = sinon.mock().returns(undefined)
      const funcMeta = {
        decodeResponse
      }
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x00
      }
      const res = sut(funcMeta, frame)
      expect(decodeResponse.calledOnce).to.be.true
      expect(res).to.be.undefined
    })

    it('should not decode request frame', () => {
      const decodeResponse = sinon.mock().returns(42)
      const funcMeta = {
        decodeResponse
      }
      const frame = {
        type: consts.REQUEST,
        funcId: 0x02
      }
      const res = sut(funcMeta, frame)
      expect(decodeResponse.notCalled).to.be.true
      expect(res).to.be.undefined
    })
  })
})
