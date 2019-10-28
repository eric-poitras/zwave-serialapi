function readArray (array) {
  let idx = 0

  function readByte (f) {
    if (idx < array.length) {
      const b = array[idx]
      idx++
      if (typeof f === 'function') {
        return f(b)
      } else {
        return b
      }
    }
  }

  function readBytes (len, f) {
    if (idx + len <= array.length) {
      const a = array.slice(idx, idx + len)
      idx += len
      if (typeof f === 'function') {
        return f(a)
      } else {
        return a
      }
    } else {
      idx += len
    }
  }

  function readWord (f) {
    let result
    readBytes(2, (a) => {
      const w = (a[0] << 8) + a[1]
      if (typeof f === 'function') {
        result = f(w)
      } else {
        result = w
      }
    })
    return result
  }

  function readInteger (f) {
    let result
    readBytes(4, (a) => {
      const i32 = ((a[0] << 24) + (a[1] << 16) + (a[2] << 8) + a[3]) & 0xffffffff
      if (typeof f === 'function') {
        result = f(i32)
      } else {
        result = i32
      }
    })
    return result
  }

  function readVarBytes (f) {
    let result
    readByte((len) => readBytes(len, (a) => {
      if (typeof f === 'function') {
        result = f(a)
      } else {
        result = a
      }
    }))
    return result
  }

  function readAsciiString (len, f) {
    let result
    readBytes(len, (a) => {
      const res = Buffer.from(a).toString('ascii')
      if (typeof f === 'function') {
        result = f(res)
      } else {
        result = res
      }
    })
    return result
  }

  return {
    readByte,
    readWord,
    readInteger,
    readBytes,
    readVarBytes,
    readAsciiString
  }
}

module.exports = readArray
