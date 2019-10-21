/* eslint-disable no-unused-expressions */
const enumfmt = require('../../lib/utils/enumfmt')
const expect = require('chai').expect

const testEnum1 = {
  1: 'ONE',
  2: 'TWO'
}

describe('enumfmt', function () {
  const sut = enumfmt(testEnum1)
  it('should build a new format with a from and to method', () => {
    expect(sut.parse).to.be.a('function')
    expect(sut.format).to.be.a('function')
  })

  describe('format()', function () {
    it('should return formated values', () => {
      expect(sut.format(1)).to.be.equal('ONE')
      expect(sut.format(2)).to.be.equal('TWO')
      expect(sut.format(3)).to.be.equal('0x03')
    })
  })

  describe('parse()', function () {
    it('should return formated values', () => {
      expect(sut.parse('ONE')).to.be.equal(1)
      expect(sut.parse('TWO')).to.be.equal(2)
      expect(sut.parse('0x03')).to.be.equal(3)
      expect(sut.parse('0xff')).to.be.equal(255)
    })
  })
})
