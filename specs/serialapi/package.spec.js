/* eslint-disable no-unused-expressions */
const expect = require('chai').expect

const serialApi = require('../..')
const serialApiImpl = require('../../lib/serialapi').serialApi

describe('serialapi package', () => {
  it('should resolve to the serialapi function', () => {
    expect(serialApi).to.equal(serialApiImpl)
  })
})
