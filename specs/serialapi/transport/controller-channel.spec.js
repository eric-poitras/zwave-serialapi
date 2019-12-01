/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const mockTime = require('../../tools/mock-time')
const { controllerChannel } = require('../../../lib/serialapi/transport/controller-channel')
const createMockSerialApi = require('../../tools/mock-serialapi')

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

  function wait () {
    return new Promise((resolve, reject) => setTimeout(resolve, 10))
  }

  describe('send()', () => {
    it('should send a command', () => {
      const command = { nodeId: 12, command: [0x10, 0x20] }
      const result = sut.send(command)

      return wait().then(() => {
        mockSerialApi.withNextRequest(req => {
          expect(req.command).to.deep.equal(command)
          req.response({ success: true })
        })
        return result
      }).then(() => console.log('hello'))
    })
  })
})
