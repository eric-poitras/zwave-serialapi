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
        sut.send({ funcId: 0x02 }).then(onComplete, onError)

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
        sut.send({ funcId: 0x02 }).then(onComplete, onError)

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

      describe('with response', () => {
        it('should complete after receiving response', () => {
          const onComplete = sinon.mock()
          const onError = sinon.mock()
          sut.send({ funcId: 0x02 }, {
            handleResponse: function (frame, callbackId) {
              return { funcId: frame.funcId, params: frame.params, callbackId, response: 'This is it!' }
            }
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
            expect(onComplete.args[0][0]).to.equal('This is it!')
          })
        })

        it('should fail if response arrive after the response timeout', () => {
          const onComplete = sinon.mock()
          const onError = sinon.mock()
          sut.send({ funcId: 0x02 }, {
            handleResponse: function (frame, callbackId) {
              return { funcId: frame.funcId, params: frame.params, callbackId, response: 'This is it!' }
            }
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
    })

    describe('on(\'receive\')', () => {
      it('should emit requests with decoded callback', () => {
        const onRequest = sinon.mock()
        sut.on('request', onRequest)

        return port.emitData('0115004984230f0410012532272c2b7085567286ef8213').then(() => {
          expect(onRequest.calledOnce).to.be.true
          expect(onRequest.args[0][0]).to.be.deep.equal({ funcId: 73, data: [132, 35, 15, 4, 16, 1, 37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130], callback: { updateStatus: 'NODE_INFO_RECEIVED', nodeId: 35, deviceClasses: { basic: 4, generic: 16, specific: 1 }, commandClasses: [37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130] } })
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
