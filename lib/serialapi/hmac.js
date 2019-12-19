const SerialPort = require('serialport')
const EventEmitter = require('events')
const Const = require('./consts')
const Frames = require('./frames')
const log = require('debug')('serialapi/hmac')
const { BehaviorSubject } = require('rxjs')
const { distinctUntilChanged } = require('rxjs/operators')

function distinctSubject (observable, subject) {
  observable.pipe(distinctUntilChanged()).subscribe(subject)
  return subject
}

function createHmac (params) {
  const events = new EventEmitter()

  const isOpen = new BehaviorSubject(false)
  let openPromise
  let closePromise

  let ackTimeout
  let txBackoffTimeout
  let recvTimeout
  let recvBuf = Buffer.alloc(0)
  let dataFrame

  const port = new SerialPort(params.port, {
    autoOpen: false,
    baudRate: 115200,
    parity: 'none',
    dataBits: 8,
    stopBits: 1
  })
  port.on('data', recvData)
  port.on('close', close)

  function portWrite (buf) {
    return new Promise((resolve, reject) => {
      port.write(buf, (err) => {
        log('frame-out: %s', buf.toString('hex'))
        events.emit('frame-out', {
          error: err,
          frame: buf
        })
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  function sendACK () {
    return portWrite(Buffer.from([Const.ACK]))
  }

  function sendNAK () {
    return portWrite(Buffer.from([Const.NAK]))
  }

  function open () {
    if (isOpen.value) {
      return Promise.resolve()
    } else if (!openPromise) {
      openPromise = closePromise ? closePromise.then(() => openInternal()) : openInternal()
    }
    return openPromise

    function openInternal () {
      return new Promise(function (resolve, reject) {
        try {
          port.open((err) => {
            if (err) {
              reject(new Error(`Failed to open serial port: ${err}`))
            } else {
              isOpen.next(true)
              openPromise = undefined
              log(`Port ${params.port} opened.`)
              resolve()
            }
          })
        } catch (e) {
          reject(new Error(`Failed to open serial port: ${e}`))
        }
      }).then(sendNAK)
    }
  }

  function close () {
    if (!isOpen.value) {
      return Promise.resolve()
    } else if (!closePromise) {
      closePromise = openPromise ? openPromise.then(closeInternal) : closeInternal()
    }
    return closePromise

    function closeInternal () {
      return new Promise(function (resolve, reject) {
        if (dataFrame) {
          dataFrame.reject(new Error('Port closed.'))
          dataFrame = undefined
        }
        if (ackTimeout) {
          clearTimeout(ackTimeout)
          ackTimeout = undefined
        }
        if (txBackoffTimeout) {
          clearTimeout(txBackoffTimeout)
          txBackoffTimeout = undefined
        }
        if (recvTimeout) {
          clearTimeout(recvTimeout)
          recvTimeout = undefined
        }
        port.close(() => {
          isOpen.next(false)
          closePromise = undefined
          log(`Port ${params.port} closed.`)
          resolve()
        })
      })
    }
  }

  function recvData (buf) {
    recvBuf = Buffer.concat([recvBuf, buf])
    const result = Frames.decodeFrames(recvBuf)
    result.frames.forEach(recvFrame)
    recvBuf = result.remaining

    // If we received complete frames, clear any timeout.
    if (result.frames.length > 0 && recvTimeout) {
      clearTimeout(recvTimeout)
      recvTimeout = undefined
    }

    // If we have remaining data to receive, set a timeout.
    if (recvBuf.length > 0 && !recvTimeout) {
      recvTimeout = setTimeout(() => {
        recvBuf = Buffer.alloc(0)
        recvTimeout = undefined
      }, 1500)
    }
  }

  function recvFrame (frame) {
    events.emit('frame-in', frame)
    log('frame-in: %s', frame.frame.toString('hex'))
    if (frame.valid) {
      if (frame.marker === Const.SOF) {
        sendACK()
        events.emit('dataframe', {
          type: frame.type,
          funcId: frame.funcId,
          params: frame.params
        })
      } else {
        // cancel any ack timeout
        if (ackTimeout) {
          clearTimeout(ackTimeout)
          ackTimeout = undefined
        }
        if (dataFrame && !txBackoffTimeout) {
          if (frame.marker === Const.ACK) {
            dataFrame.resolve()
            dataFrame = undefined
          } else {
            clearTimeout(ackTimeout)
            retryWriteDataFrame()
          }
        }
      }
    } else {
      sendNAK()
    }
  }

  function performWriteDataFrame () {
    ackTimeout = setTimeout(retryWriteDataFrame, 1600)
    return portWrite(Frames.encodeDataFrame(Const.REQUEST, dataFrame.funcId, dataFrame.params))
  }

  function retryWriteDataFrame () {
    const txCount = dataFrame.txCount
    dataFrame.txCount++
    if (txCount <= 2) {
      txBackoffTimeout = setTimeout(() => {
        txBackoffTimeout = undefined
        performWriteDataFrame()
      }, 100 + txCount * 1000)
    } else {
      dataFrame.reject(new Error('Failed after 3 retries'))
      dataFrame = undefined
    }
  }

  function write (df) {
    if (dataFrame) {
      throw new Error('Cannot send a request while another is processing.')
    }
    return new Promise((resolve, reject) => {
      dataFrame = {
        txCount: 0,
        type: df.type || Const.REQUEST,
        funcId: df.funcId,
        params: df.params || Buffer.alloc(0),
        resolve,
        reject
      }
      performWriteDataFrame()
    })
  }

  return {
    isOpen: distinctSubject(isOpen, new BehaviorSubject(false)),
    open,
    close,
    on: events.on.bind(events),
    once: events.once.bind(events),
    off: events.off.bind(events),
    write
  }
}
module.exports = createHmac
