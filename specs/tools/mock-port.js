const serialport = require('serialport')
const sinon = require('sinon').createSandbox('serialport.mock')
const MockBinding = require('@serialport/binding-mock')

function setupMockPort (name) {
  const parameters = {
    autoOpen: false,
    baudRate: 115200,
    parity: 'none',
    dataBits: 8,
    stopBits: 1
  }

  const wait = function (ms) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, ms)
    })
  }

  let port

  function constructor (path, options) {
    if (!port) {
      port = this
    } else {
      throw new Error('This mock can only be used once.')
    }
    options = Object.assign({
      binding: MockBinding
    }, options)
    serialport.apply(this, [path, options])
  }
  constructor.prototype = serialport.prototype

  MockBinding.createPort(name, {
    record: true
  })

  function recvData (len) {
    if (port) {
      const buffer = port.binding.recording
      if (!buffer) {
        return Buffer.alloc(0)
      }
      if (!len) {
        len = buffer.length
      }
      const result = buffer.slice(0, len)
      const remaining = Buffer.alloc(Math.max(buffer.length - len, 0))
      buffer.copy(remaining, 0, len, buffer.length)
      port.binding.recording = remaining
      return result
    } else throw new Error(`Cannot retrieve sent data on MockPort ${name}. It is not created.`)
  }

  function flushRecvData () {
    port.binding.recording = Buffer.alloc(0)
    return wait(0)
  }

  function emitData (buf) {
    if (port) {
      if (typeof buf === 'string') {
        buf = Buffer.from(buf, 'hex')
      }
      port.binding.emitData(buf)
    } else throw new Error(`Cannot send data on MockPort ${name}. It is not created.`)
    return wait(0)
  }

  function expectToReceive (expected, msg) {
    expected = Buffer.from(expected)
    const actual = recvData(expected.length)
    if (!actual.equals(expected)) {
      throw new Error(`Expected to receive ${expected.toString('hex')} but received ${actual.toString('hex')}. ${msg}.`)
    }
  }

  function expectNoMoreReceivedData () {
    if (port) {
      const buffer = port.binding.recording
      if (!buffer || buffer.length === 0) return
      throw new Error(`Expected no more data but received ${buffer.toString('hex')}.`)
    }
  }

  function close () {
    sinon.restore()
    if (port && port.isOpen) {
      port.close()
      port = undefined
    }
    return wait(0)
  }

  function stubMethod (proto, method) {
    const orgMethod = proto[method]
    return sinon.stub(proto, method).callsFake(orgMethod)
  }

  return {
    api: {
      constructor: sinon.spy(constructor),
      open: stubMethod(serialport.prototype, 'open'),
      close: stubMethod(serialport.prototype, 'close')
    },
    name,
    parameters,
    wait,
    recvData,
    flushRecvData,
    emitData,
    expectToReceive,
    expectNoMoreReceivedData,
    close
  }
}

module.exports = setupMockPort
