module.exports = function (data) {
  if (Buffer.isBuffer(data)) return data
  if (typeof data === 'string') return Buffer.from(data, 'hex')
  if (data === undefined || data === null) return Buffer.alloc(0)
  return Buffer.from(data)
}
