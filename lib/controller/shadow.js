const { Subject } = require('rxjs')

function createShadow () {
  const items = {}
  const updates = new Subject()
  function getAll () {
    const result = JSON.parse(JSON.stringify(items))
    return Promise.resolve(result)
  }

  function get (topic) {
    return Promise.resolve(items[topic] || null)
  }

  function put (topic, item) {
    const oldDevice = items[topic]
    if (!item) {
      delete items[topic]
    } else {
      items[topic] = item
    }
    const result = {
      deviceId: topic,
      previous: oldDevice || null,
      current: item || null
    }
    updates.next(result)
    return Promise.resolve(result)
  }

  return {
    getAll,
    get,
    put,
    events: updates
  }
}

module.exports = createShadow
