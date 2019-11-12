/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const sinon = require('sinon')
const consts = require('../../../lib/serialapi/consts')
const proxyquire = require('proxyquire')

describe('functions (index.js)', () => {
  describe('processCallback', () => {
    let decodeCallback
    let sut

    beforeEach(() => {
      decodeCallback = sinon.mock().returns(42)
      sut = proxyquire('../../../lib/serialapi/functions', {
        './func-02': { name: 'testName', decodeCallback }
      }).processCallback
    })

    it('should decode request frame with matching decoder', () => {
      const frame = {
        type: consts.REQUEST,
        funcId: 0x02
      }
      const res = sut(frame)
      expect(decodeCallback.withArgs(frame).calledOnce).to.be.true
      expect(res).to.be.deep.equal({ name: 'testName', request: 42 })
    })

    it('should node decode request frame with no decoder', () => {
      const decodeCallback = sinon.mock().returns(42)
      const frame = {
        type: consts.REQUEST,
        funcId: 0x00
      }
      const res = sut(frame)
      expect(decodeCallback.notCalled).to.be.true
      expect(res).to.be.undefined
    })

    it('should not decode response frame', () => {
      const decodeCallback = sinon.mock()
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x01
      }
      const lookup = {
        0x01: {
          decodeCallback
        }
      }
      const res = sut(lookup, frame)
      expect(decodeCallback.notCalled).to.be.true
      expect(res).to.be.undefined
    })
  })

  describe('decodeResponseFrame', () => {
    let decodeResponse
    let sut

    beforeEach(() => {
      decodeResponse = sinon.mock().returns(42)
      sut = proxyquire('../../../lib/serialapi/functions', {
        './func-02': { name: 'testName', decodeResponse }
      }).processResponse
    })

    it('should decode response frame with matching decoder', () => {
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x02
      }
      const res = sut(frame)
      expect(decodeResponse.calledOnce).to.be.true
      expect(res).to.be.deep.equal({ name: 'testName', response: 42 })
    })

    it('should node decode response frame with no decoder', () => {
      const frame = {
        type: consts.RESPONSE,
        funcId: 0x00
      }
      const res = sut(frame)
      expect(decodeResponse.notCalled).to.be.true
      expect(res).to.be.undefined
    })

    it('should not decode request frame', () => {
      const frame = {
        type: consts.REQUEST,
        funcId: 0x02
      }
      const res = sut(frame)
      expect(decodeResponse.notCalled).to.be.true
      expect(res).to.be.undefined
    })
  })
})
