/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const mockTime = require('../../tools/mock-time')
const { controllerChannel } = require('../../../lib/serialapi/transport/controller-channel')
const createMockSerialApi = require('../../tools/mock-serialapi')
const sinon = require('sinon')

describe('controllerChannel', () => {
  let clock
  before(() => {
    clock = mockTime()
  })

  after(() => {
    clock.restore()
    clock = undefined
  })

  let sut
  let mockSerialApi
  beforeEach(() => {
    mockSerialApi = createMockSerialApi()
    sut = controllerChannel(mockSerialApi.api)
  })

  afterEach(() => {
    sut = undefined
    mockSerialApi = undefined
  })

  it('should be a channel', () => {
    expect(sut.send).to.be.a('function')
    expect(sut.events).to.be.a('object')
    expect(sut.events.subscribe).to.be.a('function')
  })

  function wait (timeout) {
    timeout = timeout || 0
    return new Promise((resolve, reject) => setTimeout(resolve, timeout))
  }

  function waitForRetry (mockSerialApi, timeout) {
    timeout = timeout || 1500
    return wait(timeout).then(() => {
      expect(mockSerialApi.getRequestCount()).to.be.equal(0)
      return wait()
    })
  }

  describe('send()', () => {
    it('should send a command', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const result = sut.send(command)

      return wait().then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true }, { txStatus: 'OK' })
        })
        return result
      })
    })

    it('should resend a command after timeout if send data fails', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const result = sut.send(command)

      wait().then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: false })
        })
        return waitForRetry(mockSerialApi)
      }).then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true }, { txStatus: 'OK' })
        })
      })
      return result
    })

    it('should resend a command if send data callback return a FAIL status', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const result = sut.send(command)

      wait().then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true }, { txStatus: 'FAIL' })
        })
        return waitForRetry(mockSerialApi)
      }).then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true }, { txStatus: 'OK' })
        })
      })
      return result
    })

    it('should resend a command if send data throw an error', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const result = sut.send(command)

      wait().then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.error(new Error('Faked Error'))
        })
        return waitForRetry(mockSerialApi)
      }).then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true }, { txStatus: 'OK' })
        })
      })
      return result
    })

    it('should retry multiple time and eventually fail', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const onComplete = sinon.spy()
      const onError = sinon.spy()
      sut.send(command).then(onComplete, onError)

      const tryOnce = () => {
        try {
          mockSerialApi.withNextRequest(req => {
            expect(req.command).to.deep.equal(command)
            req.response({ success: false })
          })
        } catch (e) {
          console.log(e)
        }
        return waitForRetry(mockSerialApi)
      }

      return wait().then(tryOnce).then(tryOnce).then(tryOnce).then(tryOnce).then(() => {
        expect(onError.calledOnce).to.be.true
      })
    })
  })
})
