/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const frames = require('../../lib/serialapi/frames')
const zwconsts = require('../../lib/serialapi/consts')

describe('frames', function () {
  describe('checksum()', function () {
    it('should calculate the buffer range checksum correctly.', function () {
      const checksum1 = frames.checksum(Buffer.from([10, 20, 50]), 0, 3)
      const checksum2 = frames.checksum(Buffer.from([10, 20, 50]), 0, 2)
      const checksum3 = frames.checksum(Buffer.from([10, 20, 50]), 1, 3)
      expect(checksum1).to.equal(211)
      expect(checksum2).to.equal(225)
      expect(checksum3).to.equal(217)
    })
    it('should calculate the array range checksum correctly.', function () {
      const checksum1 = frames.checksum([10, 20, 50], 0, 3)
      const checksum2 = frames.checksum([10, 20, 50], 0, 2)
      const checksum3 = frames.checksum([10, 20, 50], 1, 3)
      expect(checksum1).to.equal(211)
      expect(checksum2).to.equal(225)
      expect(checksum3).to.equal(217)
    })
    it('should calculate the buffer checksum correctly.', function () {
      const checksum = frames.checksum(Buffer.from([10, 20, 50]))
      expect(checksum).to.equal(211)
    })
    it('should calculate the array checksum correctly.', function () {
      const checksum = frames.checksum([10, 20, 50])
      expect(checksum).to.equal(211)
    })
  })

  describe('encodeFrame(type, cmdId, cmdParams[])', function () {
    it('should build a correctly formed serialapi data frame.', function () {
      const df = frames.encodeDataFrame(1, 2, [3, 4, 5])
      expect(df.equals(Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5, 248])))
    })
  })

  describe('decodeFrames(framesData)', function () {
    it('should decode only complete frames.', function () {
      const framesData = Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5])
      const f = frames.decodeFrames(framesData)
      expect(f).to.deep.equal({
        frames: [],
        remaining: Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5])
      })
    })
    it('should decode multiple frames and ignore noise.', function () {
      const framesData = Buffer.from([0xff, zwconsts.SOF, 6, 1, 2, 3, 4, 5, 248, zwconsts.ACK, zwconsts.NAK, 0xfe, zwconsts.CAN])
      const f = frames.decodeFrames(framesData)
      expect(f).to.deep.equal({
        frames: [{
          valid: true,
          marker: zwconsts.SOF,
          frame: Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5, 248]),
          type: 1,
          funcId: 2,
          params: Buffer.from([3, 4, 5])
        }, {
          valid: true,
          marker: zwconsts.ACK,
          frame: Buffer.from([zwconsts.ACK])
        }, {
          valid: true,
          marker: zwconsts.NAK,
          frame: Buffer.from([zwconsts.NAK])
        },
        {
          valid: true,
          marker: zwconsts.CAN,
          frame: Buffer.from([zwconsts.CAN])
        }],
        remaining: Buffer.alloc(0)
      })
    })

    it('should flag dataframe as invalid when checksum is invalid.', function () {
      const framesData = Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5, 247])
      const f = frames.decodeFrames(framesData)
      expect(f).to.deep.equal({
        frames: [{
          valid: false,
          frame: Buffer.from([zwconsts.SOF, 6, 1, 2, 3, 4, 5, 247])
        }],
        remaining: Buffer.alloc(0)
      })
    })
  })
})
