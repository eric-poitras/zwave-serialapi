const sinon = require('sinon')

function mockTimers () {
  const clockInterval = setInterval(() => {
    if (clock) {
      clock.next()
    }
  }, 1)
  const clock = sinon.useFakeTimers()
  function restore () {
    clock.restore()
    clearInterval(clockInterval)
  }
  return {
    restore
  }
}

module.exports = mockTimers
