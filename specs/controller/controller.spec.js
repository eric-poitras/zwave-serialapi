/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const createController = require('../../lib/controller/controller')
const mockTime = require('../tools/mock-time')
const createMockSerialApi = require('../tools/mock-serialapi')
const sinon = require('sinon')

describe('controller', () => {
  let clock
  before(() => {
    clock = mockTime()
  })

  after(() => {
    clock.restore()
    clock = undefined
  })

  describe('closed instance', () => {
    let api
    let sut

    beforeEach(function () {
      api = createMockSerialApi()
      sut = createController(api)
    })

    afterEach(function () {
      sut = null
    })

    it('should send messages', () => {
      const command = { nodeId: 21, command: [0x20, 0x01, 0xff] }
      return sut.send(command).then(() => {
        expect(api.sendData.withArgs(command).calledOnce).to.be.true
      })
    })
  })
})
