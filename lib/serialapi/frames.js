const zwconsts = require('./consts')

function checksum (buf, start, end) {
  let result = 0xff
  if (!start) {
    start = 0
  }
  if (!end) {
    end = buf.length
  }
  for (let i = start; i < end; i++) {
    result = result ^ buf[i]
  }
  return result
}

function encodeDataFrame (type, command, data) {
  const buffer = Buffer.alloc(data.length + 5)
  buffer[0] = zwconsts.SOF
  buffer[1] = data.length + 3
  buffer[2] = type
  buffer[3] = command
  for (let i = 0; i < data.length; i++) {
    buffer[i + 4] = data[i]
  }
  buffer[buffer.length - 1] = checksum(buffer, 1, buffer.length - 1)
  return buffer
}

function decodeFrames (data) {
  const frames = []
  let i = 0
  while (i < data.length) {
    const marker = data[i]

    if (marker === zwconsts.SOF) {
      if (i >= data.length - 1) {
        break
      }
      const len = data[i + 1]
      if (i + len >= data.length - 1) {
        break
      }

      const type = data[i + 2]
      const funcId = data[i + 3]
      const params = Buffer.alloc(Math.max(len - 3, 0))
      const frame = Buffer.alloc(len + 2)
      const actualChecksum = data[i + 1 + len]
      const expectedChecksum = checksum(data, i + 1, i + len + 1)
      data.copy(params, 0, i + 4)
      data.copy(frame, 0, i)
      const valid = actualChecksum === expectedChecksum

      if (valid) {
        frames.push({
          valid,
          marker: zwconsts.SOF,
          frame,
          type,
          funcId,
          params
        })
      } else {
        frames.push({
          valid,
          frame
        })
      }
      i += len + 2
    } else if (marker === zwconsts.ACK || marker === zwconsts.NAK || marker === zwconsts.CAN) {
      frames.push({
        valid: true,
        marker,
        frame: Buffer.from([marker])
      })
      i++
    } else {
      i++
    }
  }

  const remaining = Buffer.alloc(data.length - i)
  data.copy(remaining, 0, i)

  return {
    frames,
    remaining
  }
}

module.exports = {
  checksum,
  encodeDataFrame,
  decodeFrames
}
