/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const { Subject, defer, throwError, of, concat } = require('rxjs')
const { retryWhen, delay, map, mergeMap, first, tap } = require('rxjs/operators')

describe('defer', () => {
  let t = 0
  it('should be a channel', () => {
    return defer(() => Promise.resolve(1)).pipe(
      mergeMap(x => concat(of(1, 2, 3), throwError('Halp!'))),
      retryWhen(errors => errors.pipe(
        map(error => {
          if (t > 10) {
            throw new Error("Won't retry")
          } else {
            t++
          }
          return error
        }),
        delay(150)
      ))
    ).toPromise()
  })
})
