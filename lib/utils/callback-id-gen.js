function createCallbackIdGenerator () {
  let nextCallbackId = 1

  function nextId () {
    const result = nextCallbackId++ % 256
    return result === 0 ? nextId() : result
  }
  return {
    nextId
  }
}

module.exports = createCallbackIdGenerator
