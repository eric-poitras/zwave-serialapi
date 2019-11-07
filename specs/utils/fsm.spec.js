/* eslint-disable no-unused-expressions */
const fsm = require('../../lib/utils/fsm')
const expect = require('chai').expect
const sinon = require('sinon')

describe('fsm', function () {
  it('should run the simple state machine to completion', function () {
    const onInit = sinon.spy(() => ({ state: 'next', action: Promise.resolve(['nextStep', { test: true }]) }))

    const onNextEnter = sinon.stub()
    const onNext = sinon.spy(function (machine) {
      return { state: 'done', action: Promise.resolve(['succeed', 'done']) }
    })
    const onNextLeave = sinon.stub()

    const m = fsm({
      start: onInit,
      states: {
        next: {
          enter: onNextEnter,
          nextStep: onNext,
          leave: onNextLeave
        }
      }
    })
    return m.promise.then((result) => {
      expect(onInit.calledOnce).to.be.true

      const onInitCall = onInit.getCall(0)
      expect(onInitCall.args[0]).to.be.deep.equal({})
      expect(onInitCall.args[1]).to.be.deep.equal({})
      expect(onInitCall.thisValue).to.be.null

      expect(onNextEnter.calledOnce).to.be.true
      expect(onNext.calledOnce).to.be.true

      const onNextCall = onNext.getCall(0)
      expect(onNextCall.args[0]).to.be.deep.equal({ test: true })
      expect(onNextCall.thisValue).to.be.null

      expect(onNextLeave.calledOnce).to.be.true
      expect(result).to.equal('done')
    })
  })
})
