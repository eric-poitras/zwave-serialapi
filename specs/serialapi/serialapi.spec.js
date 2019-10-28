/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const proxyquire = require('proxyquire')
const mockTime = require('../tools/mock-time')
const sinon = require('sinon')

function testRequestEncoder (funcId, data) {
  data = data || []
  return (request, callbackId) => { return { meta: { funcId, data, callbackId }, request } }
}

function testResponseDecoder (response) {
  return (frame, callbackId) => {
    return { meta: { funcId: frame.funcId, params: frame.params, callbackId }, response }
  }
}

describe('serialapi', () => {
  let clock
  let MockPort
  before(() => {
    clock = mockTime()
    MockPort = require('../tools/mock-port')
  })

  after(() => {
    clock.restore()
    clock = undefined
    MockPort = undefined
  })

  describe('closed instance', () => {
    let port
    let zwport
    let sut

    beforeEach(function () {
      port = MockPort('/dev/ttyMock1')
      zwport = proxyquire('../../lib/serialapi/port', {
        serialport: port.api.constructor
      })
      sut = proxyquire('../../lib/serialapi/serialapi', {
        './port': zwport
      })({
        port: port.name
      })
    })

    afterEach(function () {
      port.close()
      port = null
      sut = null
    })

    it('isOpen() should return false', () => {
      expect(sut.isOpen()).to.be.false
    })

    it('open() should open it', () => {
      return sut.open().then(() => {
        expect(sut.isOpen()).to.be.true

        // Serial Api should send a NAK on init
        port.expectToReceive([0x15], 'Controller reset: Initial NAK')
      })
    })

    it('send() should accept the call and postpone until open', () => {
      sut.send({ encodeRequest: testRequestEncoder(0x02) })
      sut.send({ encodeRequest: testRequestEncoder(0x03) })
      return sut.open().then(() => {
        port.expectToReceive([0x15])
        return port.wait(10)
      }).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        port.emitData([0x06])
        return port.wait(10)
      }).then(() => {
        port.expectToReceive([0x01, 3, 0, 3, 0xff])
        port.emitData([0x06])
        port.expectNoMoreReceivedData()
      })
    })
  })

  describe('opened instance', () => {
    let port
    let zwport
    let sut

    beforeEach(() => {
      port = MockPort('/dev/ttyMock1')
      zwport = proxyquire('../../lib/serialapi/port', {
        serialport: port.api.constructor
      })
      sut = proxyquire('../../lib/serialapi/serialapi', {
        './port': zwport
      })({
        port: port.name
      })
      return sut.open().then(() => {
        port.flushRecvData()
      })
    })
    afterEach(() => {
      port.close()
      port = null
      sut = null
    })

    describe('send()', () => {
      it('should complete after receiving ack', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.send({ encodeRequest: testRequestEncoder(0x02) }).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.true
        })
      })

      it('should fail after timing out', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.send({ encodeRequest: testRequestEncoder(0x02) }).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onComplete.calledOnce).to.be.false
          expect(onError.called).to.be.false
          return port.wait(20000)
        }).then(() => {
          expect(onComplete.calledOnce).to.be.false
          expect(onError.calledOnce).to.be.true
        })
      })
    })

    describe('send() with response', () => {
      it('should complete after receiving response', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.send({
          encodeRequest: testRequestEncoder(0x02),
          handleResponse: testResponseDecoder('This is it!')
        }).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x01, 3, 1, 2, 0xff])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true
          expect(onComplete.args[0][0].response).to.equal('This is it!')
        })
      })

      it('should complete multiple send in a row', () => {
        const onComplete1 = sinon.mock()
        const onError1 = sinon.mock()
        sut.send({
          encodeRequest: testRequestEncoder(0x02),
          handleResponse: testResponseDecoder('This is it 1!')
        }).then(onComplete1, onError1)

        const onComplete2 = sinon.mock()
        const onError2 = sinon.mock()
        sut.send({
          encodeRequest: testRequestEncoder(0x02),
          handleResponse: testResponseDecoder('This is it 2!')
        }).then(onComplete2, onError2)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          port.expectNoMoreReceivedData()
          expect(onError1.called).to.be.false
          expect(onComplete1.called).to.be.false
          port.emitData([0x06, 0x01, 3, 1, 2, 0xff])
          return port.wait(10)
        }).then(() => {
          port.expectToReceive([0x06, 0x01, 3, 0, 2, 0xfe])
          expect(onError1.called).to.be.false
          expect(onComplete1.calledOnce).to.be.true
          expect(onComplete1.args[0][0].response).to.deep.equal('This is it 1!')
          port.emitData([0x06, 0x01, 3, 1, 2, 0xff])
          return port.wait(10)
        }).then(() => {
          port.expectToReceive([0x06])
          expect(onError2.called).to.be.false
          expect(onComplete2.calledOnce).to.be.true
          expect(onComplete2.args[0][0].response).to.deep.equal('This is it 2!')
        })
      })

      it('should complete after receiving response with the ack', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.send({
          encodeRequest: testRequestEncoder(0x02),
          handleResponse: testResponseDecoder('This is it!')
        }).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06, 0x01, 3, 1, 2, 0xff])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true
          expect(onComplete.args[0][0].response).to.deep.equal('This is it!')
        })
      })

      it('should fail if response arrive after the response timeout', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.send({
          encodeRequest: testRequestEncoder(0x02),
          handleResponse: testResponseDecoder('This is it!')
        }).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          return port.wait(20000).then(() => {
            port.emitData([0x01, 3, 1, 2, 0xff])
            return port.wait(10)
          })
        }).then(() => {
          expect(onError.called).to.be.true
          expect(onComplete.calledOnce).to.be.false
        })
      })
    })

    describe('send() with response and callbackId', () => {
      it('should complete after receiving response', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        const onEncodeRequest = sinon.spy(testRequestEncoder(0x02))
        const onEncodeResponse = sinon.spy(testResponseDecoder('This is it!'))
        const onEncodeCallback = sinon.mock()
        const params = Symbol('request')
        sut.send({
          params,
          encodeRequest: onEncodeRequest,
          handleResponse: onEncodeResponse,
          handleCallback: onEncodeCallback
        }).then(onComplete, onError)

        // Validate that the encode request is called with a callbackId
        expect(onEncodeRequest.calledOnce).to.be.true
        expect(onEncodeRequest.args[0][0]).to.deep.equal(params)
        expect(onEncodeRequest.args[0][1]).to.be.a('number')
        const callbackId = onEncodeRequest.args[0][1]
        expect(callbackId !== 0).to.be.true

        return port.wait(10).then(() => {
          port.expectToReceive([0x01, 3, 0, 2, 0xfe])
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x01, 3, 1, 2, 0xff])
          return port.wait(10)
        }).then(() => {
          // Validate onEncodeResponse to be called with correct parameters
          expect(onEncodeResponse.calledOnce).to.be.true
          expect(onEncodeResponse.args[0][0]).to.be.deep.equal({ type: 1, funcId: 2, params: Buffer.alloc(0) })
          expect(onEncodeResponse.args[0][1]).to.be.equal(callbackId)

          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true
          expect(onComplete.args[0][0].response).to.equal('This is it!')
        })
      })
    })

    describe('on(\'receive\')', () => {
      it('should emit requests with decoded callback', () => {
        const onRequest = sinon.mock()
        sut.on('request', onRequest)

        return port.emitData('0115004984230f0410012532272c2b7085567286ef8213').then(() => {
          expect(onRequest.calledOnce).to.be.true
          expect(onRequest.args[0][0]).to.be.deep.equal({ updateStatus: 'NODE_INFO_RECEIVED', nodeId: 35, nodeInfo: { basicClass: 4, genericClass: 16, specificClass: 1, commandClasses: [37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130] }, meta: { funcId: 73, data: [132, 35, 15, 4, 16, 1, 37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130], callbackId: undefined } })
        })
      })
    })

    describe('close()', () => {
      it('should close the serialapi', () => {
        expect(sut.isOpen()).to.be.true
        expect(port.api.close.calledOnce).to.be.false
        return sut.close().then(() => {
          expect(sut.isOpen()).to.be.false
          expect(port.api.close.calledOnce).to.be.true
        })
      })
    })
  })
})
