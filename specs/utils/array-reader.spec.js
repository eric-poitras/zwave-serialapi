/* eslint-disable no-unused-expressions */
const arrayReader = require('../../lib/utils/array-reader')
const expect = require('chai').expect

describe('arrayReader', function () {
  describe('readByte()', () => {
    it('should read one byte after the other', () => {
      const buf = [10, 20, 30, 10]
      const sut = arrayReader(buf)
      let b1, b2, b3, b4, b5

      sut.readByte((b) => { b1 = b })
      sut.readByte((b) => { b2 = b })
      sut.readByte((b) => { b3 = b })
      sut.readByte((b) => { b4 = b })
      sut.readByte((b) => { b5 = b })

      expect(b1).to.equal(10)
      expect(b2).to.equal(20)
      expect(b3).to.equal(30)
      expect(b4).to.equal(10)
      expect(b5).to.be.undefined
    })
  })
  describe('readFixedLen()', () => {
    it('should read a structure with a fix length one after the other but no partial structure', () => {
      const buf = [10, 20, 30, 10]
      const sut = arrayReader(buf)
      let b1, b2, b3, b4

      sut.readBytes(1, (b) => { b1 = b })
      sut.readBytes(2, (b) => { b2 = b })
      sut.readBytes(2, (b) => { b3 = b })
      sut.readBytes(1, (b) => { b4 = b })

      expect(b1).to.deep.equal([10])
      expect(b2).to.deep.equal([20, 30])
      expect(b3).to.be.undefined
      expect(b4).to.be.undefined
    })
  })
  describe('readVarBytes()', () => {
    it('should read variable len struct of 0 at the end of the array', () => {
      const buf = [0]
      const sut = arrayReader(buf)
      let b1

      sut.readVarBytes((b) => { b1 = b })

      expect(b1).to.deep.equal([])
    })

    it('should read variable len struct in sequence one but no partial structure', () => {
      const buf = [2, 20, 30, 3, 11, 21, 31, 2, 10]
      const sut = arrayReader(buf)
      let b1, b2, b3

      sut.readVarBytes((b) => { b1 = b })
      sut.readVarBytes((b) => { b2 = b })
      sut.readVarBytes((b) => { b3 = b })

      expect(b1).to.deep.equal([20, 30])
      expect(b2).to.deep.equal([11, 21, 31])
      expect(b3).to.be.undefined
    })
  })

  it('should allow a mix and match of sequential read of structures', () => {
    const buf = [1, 2, 20, 30, 3, 11, 21, 31, 2, 10]
    const sut = arrayReader(buf)
    let b1, b2, b3, b4

    sut.readByte((b) => { b1 = b })
    sut.readVarBytes((b) => { b2 = b })
    sut.readBytes(3, (b) => { b3 = b })
    sut.readVarBytes((b) => { b4 = b })

    expect(b1).to.equal(1)
    expect(b2).to.deep.equal([20, 30])
    expect(b3).to.deep.equal([3, 11, 21])
    expect(b4).to.be.undefined
  })
})
