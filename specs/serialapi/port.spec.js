/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noPreserveCache().noCallThru()
const Consts = require('../../lib/serialapi/consts')
const mockTime = require('../tools/mock-time')

function shouldNotHappens () { sinon.assert.fail('This should not happens') }

describe('zwave port', function () {
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

  describe('constructor', function () {
    let port
    let sut
    beforeEach(function () {
      port = MockPort('/dev/ttyMock1')
      sut = proxyquire('../../lib/serialapi/port', {
        serialport: port.api.constructor,
        '@global': true
      })
    })

    afterEach(function () {
      port.close()
      port = null
      sut = null
    })

    it('should create the port with correct parameters and return a closed hmac instance', function () {
      const hmac = sut({
        port: port.name
      })

      expect(port.api.constructor.withArgs(port.name, port.parameters).calledOnce).to.be.true
      expect(port.api.open.notCalled).to.be.true
      expect(hmac).to.be.not.empty
      expect(hmac.isOpen.value).to.be.false
    })
  })

  describe('closed instance', function () {
    let port
    let sut

    beforeEach(function () {
      port = MockPort('/dev/ttyMock1')
      sut = proxyquire('../../lib/serialapi/port', {
        serialport: port.api.constructor
      })({
        port: port.name
      })
    })

    afterEach(function () {
      port.close()
      port = null
      sut = null
    })

    it('method open() should open the port', () => {
      expect(port.api.open.notCalled).to.be.true

      const onOpen = sinon.spy()
      const sub = sut.isOpen.subscribe(onOpen)

      const result = sut.open().then(() => {
        expect(sut.isOpen.value).to.be.true
        expect(port.api.open.calledOnce).to.be.true

        // State change events are emitted
        expect(onOpen.withArgs(true).calledOnce).to.be.true

        // Serial Api should send a NAK on init
        port.expectToReceive([Consts.NAK], 'Controller reset: Initial NAK')
      })
      expect(sut.isOpen.value).to.be.false
      return result.finally(() => sub.unsubscribe())
    })

    it('method open() and close() should work even when used multiple times', () => {
      expect(port.api.open.notCalled).to.be.true

      const onOpenChanged = sinon.spy()
      const sub = sut.isOpen.subscribe(onOpenChanged)

      const result = sut.open().then(() => {
        expect(sut.isOpen.value).to.be.true
        expect(port.api.open.calledOnce).to.be.true

        expect(onOpenChanged.withArgs(true).calledOnce).to.be.true
        expect(onOpenChanged.withArgs(false).calledTwice).to.be.false
        port.expectToReceive([Consts.NAK], 'Controller reset: Initial NAK')
        return sut.close()
      }).then(() => {
        expect(sut.isOpen.value).to.be.false
        expect(port.api.open.calledOnce).to.be.true
        expect(onOpenChanged.withArgs(true).calledOnce).to.be.true
        expect(onOpenChanged.withArgs(false).calledTwice).to.be.true
        return sut.open()
      }).then(() => {
        expect(sut.isOpen.value).to.be.true
        expect(port.api.open.calledTwice).to.be.true
        expect(onOpenChanged.withArgs(true).calledTwice).to.be.true
        expect(onOpenChanged.withArgs(false).calledTwice).to.be.true
      })
      expect(sut.isOpen.value).to.be.false
      return result.finally(() => sub.unsubscribe())
    })

    it('method open() should fail if serial port fail to open', () => {
      expect(port.api.open.notCalled).to.be.true
      port.api.open.throws('Open Error!')

      const onOpen = sinon.spy()
      sut.on('open', onOpen)

      const result = sut.open().then(shouldNotHappens, (err) => {
        expect(err).to.be.not.null
        expect(sut.isOpen.value).to.be.false
        expect(port.api.open.calledOnce).to.be.true

        // State change events are emitted
        expect(onOpen.calledOnce).to.be.false
      })
      expect(sut.isOpen.value).to.be.false
      return result
    })
  })

  describe('opened instance', function () {
    let port
    let sut

    beforeEach(function () {
      port = MockPort('/dev/ttyMock1')
      sut = proxyquire('../../lib/serialapi/port', {
        serialport: port.api.constructor
      })({
        port: port.name
      })
      return sut.open().then(() => {
        return port.flushRecvData()
      })
    })

    afterEach(function () {
      port.close()
      port = null
      sut = null
    })

    it('method open() on an already opened port should throw an exception', () => {
      return sut.open().then(() => {
        expect(sut.isOpen.value).to.be.true
      })
    })

    it('dataframe are received and ACKed', () => {
      const rawFramesIn = []
      const dataframes = []
      sut.on('frame-in', (frame) => rawFramesIn.push(frame))
      sut.on('dataframe', (frame) => dataframes.push(frame))
      return port.wait(0).then(() => port.emitData(Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5, 248])))
        .then(() => {
          expect(rawFramesIn).to.deep.equals([{
            valid: true,
            marker: Consts.SOF,
            frame: Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5, 248]),
            type: 1,
            funcId: 2,
            params: Buffer.from([3, 4, 5])
          }])
          expect(dataframes).to.deep.equals([{
            type: 1,
            funcId: 2,
            params: Buffer.from([3, 4, 5])
          }])
          port.expectToReceive([Consts.ACK])
        })
    })

    it('invalid dataframe are received and NAKed', () => {
      const frames = []
      sut.on('frame-in', (frame) => frames.push(frame))
      return port.emitData(Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5, 247])) // CHECKSUM invalid
        .then(() => {
          expect(frames).to.deep.equals([{
            valid: false,
            frame: Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5, 247])
          }])
          port.expectToReceive([Consts.NAK])
        })
    })

    it('fragmented dataframe are received and ACKed', () => {
      const frames = []
      sut.on('frame-in', (frame) => frames.push(frame))
      return port.emitData(Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5]))
        .then(() => port.emitData(Buffer.from([248])))
        .then(() => {
          expect(frames).to.deep.equals([{
            valid: true,
            marker: Consts.SOF,
            frame: Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5, 248]),
            type: 1,
            funcId: 2,
            params: Buffer.from([3, 4, 5])
          }])
          port.expectToReceive([Consts.ACK])
        })
    })

    it('fragmented dataframe are not receive if they timeout', () => {
      const frames = []
      sut.on('frame-in', (frame) => frames.push(frame))
      return port.emitData(Buffer.from([Consts.SOF, 6, 1, 2, 3, 4, 5]))
        .then(() => port.wait(1600))
        .then(() => port.emitData(Buffer.from([248])))
        .then(() => {
          expect(frames).to.deep.equals([])
        })
    })

    it('write() send dataframe and resolve when ack', () => {
      const callSpy = sinon.spy()
      const callPromise = sut.write({
        funcId: 1,
        params: Buffer.from([2, 3, 4, 5])
      }).then(callSpy)

      const portPromise = port
        .wait(0)
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpy.calledOnce).to.be.false
          return port.emitData([Consts.ACK])
        }).then(() => {
          expect(callSpy.calledOnce).to.be.true
        })

      return Promise.all([callPromise, portPromise])
    })

    it('write() send dataframe and reject after 3 retries naks / cans', () => {
      const callSpyResolve = sinon.spy()
      const callSpyReject = sinon.spy()
      const callPromise = sut.write({
        funcId: 1,
        params: Buffer.from([2, 3, 4, 5])
      })
      callPromise.then(callSpyResolve, callSpyReject)
      const portPromise = port
        .wait(0)
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.NAK])
        })
        .then(() => port.wait(101))
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.CAN])
        })
        .then(() => port.wait(1101))
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.NAK])
        })
        .then(() => port.wait(2101))
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.NAK])
        })
        .then(() => port.wait(0))
        .then(() => {
          expect(callSpyResolve.called).to.be.false
          expect(callSpyReject.called).to.be.true
        })

      return Promise.all([callPromise.catch(e => {}), portPromise])
    })

    it('write() send dataframe and reject after 3 retries with timeouts', () => {
      const callSpyResolve = sinon.spy()
      const callSpyReject = sinon.spy()
      const callPromise = sut.write({
        funcId: 1,
        params: Buffer.from([2, 3, 4, 5])
      })
      callPromise.then(callSpyResolve, callSpyReject)
      const portPromise = port
        .wait(0)
        .then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          return port.wait(1600 + 101)
        }).then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.CAN])
          return port.wait(1600 + 1101)
        }).then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          port.emitData([Consts.NAK])
          return port.wait(1600 + 2101)
        }).then(() => {
          port.expectToReceive([Consts.SOF, 7, Consts.REQUEST, 1, 2, 3, 4, 5, 249], 'DataFrame')
          expect(callSpyResolve.called).to.be.false
          expect(callSpyReject.called).to.be.true
        })

      return Promise.all([callPromise.catch(e => {}), portPromise])
    })

    it('close() should close the port', () => {
      expect(port.api.close.notCalled).to.be.true

      const onCloseSpy = sinon.spy()
      const sub = sut.isOpen.subscribe(onCloseSpy)

      return sut.close().then(() => {
        expect(sut.isOpen.value).to.be.false
        expect(port.api.close.calledOnce).to.be.true
        expect(onCloseSpy.withArgs(false).calledOnce).to.true
      }).finally(() => sub.unsubscribe())
    })

    it('if serial port close, the zwave port should close as well,', () => {
      const onClose = sinon.spy()
      const sub = sut.isOpen.subscribe(onClose)

      return port.close().then(() => {
        expect(sut.isOpen.value).to.be.false
        expect(onClose.calledTwice).to.be.true
      }).finally(() => sub.unsubscribe())
    })
  })
})
