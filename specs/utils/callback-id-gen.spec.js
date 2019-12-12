/* eslint-disable no-unused-expressions */
const sut = require('../../lib/utils/callback-id-gen')
const expect = require('chai').expect

describe('createCallbackIdGenerator', function () {
  describe('nextId()', () => {
    it('should not return 0 nor any value greater that 255', () => {
      const instance = sut()
      const last255Values = []
      for (let i = 0; i < 512; i++) {
        const res = instance.nextId()
        expect(res).to.be.greaterThan(0)
        expect(res).to.be.lessThan(256)
        expect(last255Values).to.not.include(res)

        last255Values.push(res)
        while (last255Values.length >= 255) {
          last255Values.shift()
        }
      }
    })
  })
})
