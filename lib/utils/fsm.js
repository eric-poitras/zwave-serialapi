const log = require('debug')('serialapi/port')
const createPromise = require('./create-promise')

function fsm (options) {
  const machine = Object.defineProperties({}, {
    sendAction: { value: sendAction },
    startTimeout: { value: startTimeout },
    stopTimeout: { value: stopTimeout },
    pipePromise: { value: pipePromise },
    hookEvent: { value: hookEvent },
    unhookEvent: { value: unhookEvent }
  })
  const actions = []
  const timeouts = {}
  const hookedEvents = {}
  const response = createPromise()
  const { states } = options
  let dispatching = false
  let state
  let running = true

  states.init = states.start || {}
  states.init.start = options.start
  states.done = {
    failed: function (payload) {
      response.reject(payload)
      disposeResources()
    },
    succeed: function (payload) {
      response.resolve(payload)
      disposeResources()
    }
  }

  setState('init')
  sendAction('start')

  function disposeResources () {
    for (const k of Object.keys(timeouts)) {
      clearTimeout(timeouts[k])
    }
    running = false
  }

  function dispatchAction () {
    if (running && !dispatching && actions.length > 0) {
      dispatching = true
      new Promise(resolve => {
        const { type, payload } = actions.shift()
        log('%s.%s(%j)', state, type, payload)
        const route = states[state][type].apply(null, [payload, machine])
        if (route) {
          const { state: nextState, action: actionToPush } = route
          setState(nextState)
          resolve(Promise.resolve(actionToPush).then(a => Promise.all(a)))
        } else {
          resolve()
        }
      }).then(actionToPush => {
        actionToPush && sendAction.apply(null, actionToPush)
      }).catch(
        err => {
          sendAction('failed', err)
          setState('done')
        }).finally(() => {
        dispatching = false
        dispatchAction()
      })
    }
  }

  function setState (newState) {
    if (newState) {
      if (!states[newState]) {
        throw new Error(`State ${newState} is not defined.`)
      }
      if (state !== newState) {
        const oldState = state
        if (state && typeof states[state].leave === 'function') {
          log('%s.leave(%j)', state, machine)
          states[state].leave.apply(machine, [machine])
        }
        state = newState
        try {
          if (typeof states[newState].enter === 'function') {
            log('%s.enter(%j)', state, machine)
            states[newState].enter.apply(machine, [machine])
          }
        } catch (e) {
          state = oldState
          throw e
        }
      }
    }
  }

  function sendAction (type, payload) {
    payload = payload || {}
    actions.push({ type, payload })
    dispatchAction()
  }

  function startTimeout (timeoutName, timeout) {
    if (!timeouts[timeoutName]) {
      timeouts[timeoutName] = setTimeout(() => {
        delete timeouts[timeoutName]
        sendAction(timeoutName, timeout)
      }, timeout)
    }
  }

  function stopTimeout (timeoutName) {
    if (timeouts[timeoutName]) {
      clearTimeout(timeouts[timeoutName])
      delete timeouts[timeoutName]
    }
  }

  function hookEvent (eventName, emitter) {
    if (!hookedEvents[eventName]) {
      var listener = (data) => sendAction(eventName + 'Event', data)
      emitter.on(eventName, listener)
      hookedEvents[eventName] = { listener, emitter }
    }
  }

  function unhookEvent (eventName) {
    var hookedEvent = hookedEvents[eventName]
    if (hookedEvent) {
      hookedEvent.emitter.off(hookedEvent.listener)
      delete hookedEvents[eventName]
    }
  }

  function pipePromise (actionPrefix, promise) {
    promise.then((res) => sendAction(actionPrefix + 'Resolve', res), (err) => sendAction(actionPrefix + 'Reject', err))
  }

  return {
    sendAction,
    promise: response.promise
  }
}

module.exports = fsm
