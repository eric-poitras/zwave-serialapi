/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const proxyquire = require('proxyquire')
const mockTime = require('../tools/mock-time')
const sinon = require('sinon')

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
      sut.send({ funcId: 0x02 })
      sut.send({ funcId: 0x03 })
      return sut.open().then(() => {
        port.expectToReceive([0x15])
        return port.wait(0)
      }).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        port.emitData([0x06])
        return port.wait(0)
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

    it('send should complete after receiving ack', () => {
      const onComplete = sinon.mock()
      const onError = sinon.mock()
      sut.send({ funcId: 0x02 }).then(onComplete, onError)

      return port.wait(0).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.false
        port.emitData([0x06])
        return port.wait(0)
      }).then(() => {
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.true
      })
    })

    it('send with callback should complete after receiving ack', () => {
      const onComplete = sinon.mock()
      const onError = sinon.mock()
      sut.send({ funcId: 0x02 }).then(onComplete, onError)

      return port.wait(0).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.false
        port.emitData([0x06])
        return port.wait(0)
      }).then(() => {
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.true
      })
    })

    it('send should fail after timing out', () => {
      const onComplete = sinon.mock()
      const onError = sinon.mock()
      sut.send({ funcId: 0x02 }).then(onComplete, onError)

      return port.wait(0).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        expect(onComplete.calledOnce).to.be.false
        expect(onError.called).to.be.false
        return port.wait(20000)
      }).then(() => {
        expect(onComplete.calledOnce).to.be.false
        expect(onError.calledOnce).to.be.true
      })
    })

    it('send with response should complete after receiving response', () => {
      const onComplete = sinon.mock()
      const onError = sinon.mock()
      sut.send({ funcId: 0x02 }, {
        handleResponse: function (frame, callbackId) {
          return { funcId: frame.funcId, params: frame.params, callbackId, response: 'This is it!' }
        }
      }).then(onComplete, onError)

      return port.wait(0).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.false
        port.emitData([0x06])
        return port.wait(0)
      }).then(() => {
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.false
        port.emitData([0x01, 3, 1, 2, 0xff])
        return port.wait(0)
      }).then(() => {
        expect(onError.called).to.be.false
        expect(onComplete.calledOnce).to.be.true
        expect(onComplete.args[0][0]).to.equal('This is it!')
      })
    })

    it('send with response should fail if response arrive after the response timeout', () => {
      const onComplete = sinon.mock()
      const onError = sinon.mock()
      sut.send({ funcId: 0x02 }, {
        handleResponse: function (frame, callbackId) {
          return { funcId: frame.funcId, params: frame.params, callbackId, response: 'This is it!' }
        }
      }).then(onComplete, onError)

      return port.wait(0).then(() => {
        port.expectToReceive([0x01, 3, 0, 2, 0xfe])
        expect(onError.called).to.be.false
        expect(onComplete.calledOnce).to.be.false
        port.emitData([0x06])
        return port.wait(0)
      }).then(() => {
        expect(onError.called).to.be.false
        expect(onComplete.called).to.be.false
        return port.wait(20000).then(() => {
          port.emitData([0x01, 3, 1, 2, 0xff])
          return port.wait(0)
        })
      }).then(() => {
        expect(onError.called).to.be.true
        expect(onComplete.calledOnce).to.be.false
      })
    })
  })
})
