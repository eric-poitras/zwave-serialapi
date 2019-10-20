const numberPattern = /0x([0-9a-fA-F]+)/

function enumfmt (lookup) {
  const inverse = {}
  for (const k of Object.keys(lookup)) {
    inverse[lookup[k]] = Number(k)
  }

  function parse (str) {
    if (inverse[str] !== undefined) {
      return inverse[str]
    } else {
      const result = str.match(numberPattern)
      if (result) {
        return parseInt(result[1], 16)
      }
    }
  }

  function format (val) {
    if (lookup[val]) {
      return lookup[val]
    } else {
      const strVal = val.toString(16)
      return `0x${strVal.length % 2 === 1 ? '0' : ''}${strVal}`
    }
  }

  return {
    parse,
    format
  }
}

module.exports = enumfmt
