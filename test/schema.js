/* globals describe it */

var should = require('should')
var config = require('../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

/* Tests data against schemas */
describe('Schema', function () {
  // const server = require('../app')

  it('receives data', function (done) {

    db.get('roots').find({ type: 'strong' }, function (err, items) {
      items.forEach(function (item) {
        describe('root ID ' + item._id, function () {
          it('doesn\'t contain j', function () {
            item.radicals.should.not.containEql('j')
          })
        })
      })
      done()

    })

  })

})
