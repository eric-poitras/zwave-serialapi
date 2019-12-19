/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const createShadow = require('../../lib/controller/shadow')
const { first } = require('rxjs/operators')

describe('shadow', () => {
  const device = { name: 'This is my device' }
  let sut

  beforeEach(() => {
    sut = createShadow()
  })

  afterEach(() => {
    sut = null
  })

  describe('without any device', () => {
    describe('getAll()', () => {
      it('should return an empty object', () => {
        return sut.getAll().then(res => {
          expect(res).to.be.deep.equal({})
        })
      })
    })

    describe('get()', () => {
      it('should return null for non-existent items', () => {
        return sut.get('non-existent').then(res => {
          expect(res).to.be.null
        })
      })
    })

    describe('put()', () => {
      it('should add a item if it does not exists', () => {
        const updates = sut.events.pipe(first()).toPromise()
        return Promise.all([sut.put('dev1', device), updates]).then((results) => {
          results.forEach((res) => {
            expect(res).to.deep.equal({
              deviceId: 'dev1',
              previous: null,
              current: device
            })
          })
        })
      })
    })
  })

  describe('with a device', () => {
    beforeEach(() => {
      return sut.put('dev1', device)
    })

    describe('getAll()', () => {
      it('should return an object containing the device', () => {
        return sut.getAll().then(res => {
          expect(res).to.be.deep.equal({ dev1: device })
        })
      })
    })

    describe('get()', () => {
      it('should return null for non-existent items', () => {
        return sut.get('non-existent').then(res => {
          expect(res).to.be.null
        })
      })

      it('should return the device', () => {
        return sut.get('dev1').then(res => {
          expect(res).to.be.deep.equal(device)
        })
      })
    })

    describe('put()', () => {
      it('should modify the item if it exists', () => {
        const modifiedDevice = { name: 'This is my modified device' }
        const updates = sut.events.pipe(first()).toPromise()
        return Promise.all([sut.put('dev1', modifiedDevice), updates]).then((results) => {
          results.forEach((res) => {
            expect(res).to.deep.equal({
              deviceId: 'dev1',
              previous: device,
              current: modifiedDevice
            })
          })
        })
      })
      it('should append a new the item if it does not exists', () => {
        const newDevice = { name: 'This is my new device' }
        const updates = sut.events.pipe(first()).toPromise()
        return Promise.all([sut.put('dev2', newDevice), updates]).then((results) => {
          results.forEach((res) => {
            expect(res).to.deep.equal({
              deviceId: 'dev2',
              previous: null,
              current: newDevice
            })
          })
        })
      })
      it('should remove an item if null is put to an existing item', () => {
        const updates = sut.events.pipe(first()).toPromise()
        return Promise.all([sut.put('dev1', null), updates]).then((results) => {
          results.forEach((res) => {
            expect(res).to.deep.equal({
              deviceId: 'dev1',
              previous: device,
              current: null
            })
          })
          return sut.getAll()
        }).then(all => {
          expect(all).to.deep.equal({})
        })
      })
    })
  })
})
