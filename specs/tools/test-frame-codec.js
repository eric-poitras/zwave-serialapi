/* eslint-disable no-unused-expressions */
const expect = require('chai').expect

function standardEncodeRequestSpecs (funcMeta, scenarios) {
  const { encodeRequest, name, funcId } = funcMeta
  describe(`encodeRequest for funcId 0x${funcId.toString(16)}, ${name}`, defineTests)

  function defineTests () {
    if (scenarios.success) {
      for (const scenarioName of Object.keys(scenarios.success)) {
        const scenario = scenarios.success[scenarioName]
        it(`should encode frame request correctly in scenario '${scenarioName}'`, function () {
          const res = encodeRequest(scenario.request, scenario.callbackId)
          expect(res.request).to.equal(scenario.request)
          expect(res.funcId).to.equal(funcId)
          expect(res.data).to.deep.equal(scenario.expected)
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
            const res = decodeResponse(dataFrame)
            expect(res).to.deep.equal({
              funcId,
              data: [...dataFrame.params],
              response: scenario.expected
            })
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
            const res = decodeResponse(dataFrame)
            expect(res).to.deep.equal({
              funcId,
              data: [...dataFrame.params],
              response: scenario.expected
            })
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
            const res = decodeCallback(dataFrame, scenario.callbackId)
            expect(res).to.deep.equal({
              funcId,
              data: [...dataFrame.params],
              callback: scenario.expected
            })
          })

          it('should not decode response if type is response', function () {
            const dataFrame = {
              type: 0x01,
              funcId,
              params: Buffer.from(scenario.data, 'hex')
            }
            const res = decodeCallback(dataFrame, scenario.callbackId)
            expect(res).to.be.undefined
          })

          it('should not decode response if funcId is invalid', function () {
            const dataFrame = {
              type: 0x00,
              funcId: funcId - 1,
              params: Buffer.from(scenario.data, 'hex')
            }
            const res = decodeCallback(dataFrame, scenario.callbackId)
            expect(res).to.be.undefined
          })

          it('should decode frame request correctly even with extra data', function () {
            const dataFrame = {
              type: 0x00,
              funcId,
              params: Buffer.from(scenario.data + '0000', 'hex')
            }
            const res = decodeCallback(dataFrame, scenario.callbackId)
            expect(res).to.deep.equal({
              funcId,
              data: [...dataFrame.params],
              callback: scenario.expected
            })
          })
        })
      }
    }
  }
}

module.exports = {
  standardEncodeRequestSpecs,
  standardDecodeResponseSpecs,
  standardDecodeCallbackSpecs
}
