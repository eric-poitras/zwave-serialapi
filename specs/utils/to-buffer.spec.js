/* eslint-disable no-unused-expressions */
const toBuffer = require('../../lib/utils/to-buffer')
const expect = require('chai').expect

describe('toBuffer', function () {
  it('should convert string to buffer using the hex strategy', function () {
    const res = toBuffer('000102ffAb')
    expect(Buffer.isBuffer(res)).to.be.true
    expect(res.toString('hex')).to.equal('000102ffab')
  })
  it('should convert array to buffer', function () {
    const res = toBuffer([0x10, 0xff, 0x12])
    expect(Buffer.isBuffer(res)).to.be.true
    expect(res.toString('hex')).to.equal('10ff12')
  })
  it('should convert null to empty buffer', function () {
    const res = toBuffer(null)
    expect(Buffer.isBuffer(res)).to.be.true
    expect(res.toString('hex')).to.equal('')
  })
  it('should convert undefined to empty buffer', function () {
    const res = toBuffer(undefined)
    expect(Buffer.isBuffer(res)).to.be.true
    expect(res.toString('hex')).to.equal('')
  })
  it('should pass buffer unmodified', function () {
    const res = toBuffer(Buffer.from([1, 2, 3]))
    expect(Buffer.isBuffer(res)).to.be.true
    expect(res.toString('hex')).to.equal('010203')
  })
})
