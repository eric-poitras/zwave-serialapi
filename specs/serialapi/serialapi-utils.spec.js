/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const sinon = require('sinon')
const consts = require('../../lib/serialapi/consts')
const serialApiUtils = require('../../lib/serialapi/serialapi-utils')

describe('serialApiUtils', () => {
  describe('buildDefinitionLookups', () => {
    const sut = serialApiUtils.buildDefinitionsLookups

    it('should index by Id and also leave the flat list.', () => {
      const definition1 = {
        funcId: 0x01
      }
      const definition2 = {
        funcId: 0x02
      }
      const result = sut([definition1, definition2])

      expect(result).to.be.an('object')
      expect(result.definitions).to.be.an('array')
      expect(result.definitionsById).to.be.an('object')
      expect(result.definitions).to.deep.contains(definition1)
      expect(result.definitions).to.deep.contains(definition2)
      expect(Object.keys(result.definitionsById)).to.be.deep.equal(['1', '2'])
      expect(result.definitionsById['1']).to.be.deep.equal(definition1)
      expect(result.definitionsById['2']).to.be.deep.equal(definition2)
    })
  })

  describe('processCallback', () => {
    const sut = serialApiUtils.processCallback

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
    const sut = serialApiUtils.processResponse

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
