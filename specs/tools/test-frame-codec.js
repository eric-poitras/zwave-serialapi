/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const funExported = require('../../lib/serialapi/functions')

function metaSpecs (funcMeta, expectedName, expectedFuncId) {
  const { name, funcId } = funcMeta
  describe(`setup for funcId 0x${expectedFuncId.toString(16)}, ${expectedName}`, defineTests)
  function defineTests () {
    it('should be registered with the correct name', () => {
      expect(name).to.equal(expectedName)
    })

    it('should be registered with the correct function id', () => {
      expect(funcId).to.equal(expectedFuncId)
    })

    it('should be registered in the function module', () => {
      const entry = funExported.filter(module => module.funcId === funcId)
      expect(entry).to.deep.equal([funcMeta])
    })
  }
}

function standardEncodeRequestSpecs (funcMeta, scenarios) {
  const { encodeRequest, name, funcId } = funcMeta
  describe(`encodeRequest for funcId 0x${funcId.toString(16)}, ${name}`, defineTests)

  function defineTests () {
    if (scenarios.success) {
      for (const scenarioName of Object.keys(scenarios.success)) {
        const scenario = scenarios.success[scenarioName]

        it(`should encode frame request correctly in scenario '${scenarioName}'`, function () {
          const callbackId = scenario.callbackId
          const hasResponse = scenario.hasResponse || false
          const data = scenario.expected
          const actualResult = encodeRequest(scenario.request, { callbackId, hasResponse })
          const expectedMeta = { funcId, data, callbackId, hasResponse }

          expect(actualResult).to.deep.equal(scenario.request)
          expect(actualResult.meta).to.deep.equal(expectedMeta)
        })
      }
    }
  }
}

function standardDecodeResponseSpecs (funcMeta, scenarios) {
  const { decodeResponse, name, funcId } = funcMeta
  describe(`decodeReponse for funcId 0x${funcId.toString(16)}, ${name}`, defineTests)

  function defineTests () {
    if (scenarios.success) {
      for (const scenarioName of Object.keys(scenarios.success)) {
        const scenario = scenarios.success[scenarioName]

        describe(`success scenario ${scenarioName}`, () => {
          it('should decode frame request correctly', function () {
            const dataFrame = {
              type: 0x01,
              funcId,
              params: Buffer.from(scenario.data, 'hex')
            }
            const actualResult = decodeResponse(dataFrame)
            const expectedMeta = {
              funcId,
              data: [...dataFrame.params]
            }
            if (typeof scenario.hasCallback !== 'undefined') expectedMeta.hasCallback = scenario.hasCallback
            expect(actualResult).to.deep.equal(scenario.expected)
            expect(actualResult.meta).to.deep.equal(expectedMeta)
          })

          it('should not decode response if type is request', function () {
            const dataFrame = {
              type: 0x00,
              funcId,
              params: Buffer.from(scenario.data, 'hex')
            }
            const res = decodeResponse(dataFrame)
            expect(res).to.be.undefined
          })

          it('should not decode response if funcId is unexpected', function () {
            const dataFrame = {
              type: 0x01,
              funcId: funcId - 1,
              params: Buffer.from(scenario.data, 'hex')
            }
            const res = decodeResponse(dataFrame)
            expect(res).to.be.undefined
          })

          it('should decode frame request correctly even with extra data', function () {
            const dataFrame = {
              type: 0x01,
              funcId,
              params: Buffer.from(scenario.data + '0000', 'hex')
            }
            const actualResult = decodeResponse(dataFrame)
            const expectedMeta = {
              funcId,
              data: [...dataFrame.params]
            }
            if (typeof scenario.hasCallback !== 'undefined') expectedMeta.hasCallback = scenario.hasCallback
            expect(actualResult).to.deep.equal(scenario.expected)
            expect(actualResult.meta).to.deep.equal(expectedMeta)
          })
        })
      }
    }
  }
}

function standardDecodeCallbackSpecs (funcMeta, scenarios) {
  const { decodeCallback, name, funcId } = funcMeta
  describe(`decodeCallback for funcId 0x${funcId.toString(16)}, ${name}`, defineTests)

  function defineTests () {
    if (scenarios.success) {
      for (const scenarioName of Object.keys(scenarios.success)) {
        const scenario = scenarios.success[scenarioName]

        describe(`success scenario ${scenarioName}`, () => {
          it('should decode frame request correctly', function () {
            const dataFrame = {
              type: 0x00,
              funcId,
              params: Buffer.from(scenario.data, 'hex')
            }
            const actualResult = decodeCallback(dataFrame)
            const expectedMeta = {
              funcId,
              data: [...dataFrame.params]
            }
            if (scenario.callbackId) expectedMeta.callbackId = scenario.callbackId
            expect(actualResult).to.deep.equal(scenario.expected)
            expect(actualResult.meta).to.deep.equal(expectedMeta)
          })

          it('should not decode response if type is response', function () {
            const dataFrame = {
              type: 0x01,
              funcId,
              params: Buffer.from(scenario.data, 'hex')
            }
            const result = decodeCallback(dataFrame)
            expect(result).to.be.undefined
          })

          it('should not decode response if funcId is invalid', function () {
            const dataFrame = {
              type: 0x00,
              funcId: funcId - 1,
              params: Buffer.from(scenario.data, 'hex')
            }
            const result = decodeCallback(dataFrame)
            expect(result).to.be.undefined
          })

          it('should decode frame request correctly even with extra data', function () {
            const dataFrame = {
              type: 0x00,
              funcId,
              params: Buffer.from(scenario.data + '0000', 'hex')
            }
            const actualResult = decodeCallback(dataFrame)
            const expectedMeta = {
              funcId,
              data: [...dataFrame.params]
            }
            if (scenario.callbackId) expectedMeta.callbackId = scenario.callbackId

            expect(actualResult).to.deep.equal(scenario.expected)
            expect(actualResult.meta).to.deep.equal(expectedMeta)
          })
        })
      }
    }
  }
}

module.exports = {
  metaSpecs,
  standardEncodeRequestSpecs,
  standardDecodeResponseSpecs,
  standardDecodeCallbackSpecs
}
