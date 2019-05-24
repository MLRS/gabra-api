/* globals describe it */

var should = require('should')
var config = require('../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

var fs = require('fs')
var Ajv = require('ajv')
var ajv = new Ajv({
  formats: {
    // TODO these are not standard but defined by json-editor
    table: () => true,
    textarea: () => true,
    checkbox: () => true,
    datetime: () => true,
  }
}) // https://www.npmjs.com/package/ajv#options

/* Tests data against schemas */
describe('Schema', function () {

  describe('Roots', function () {
    var schema = JSON.parse(fs.readFileSync('public/schemas/root.json'))
    var validate = ajv.compile(schema)

    it('receives data', function (done) {
      db.get('roots').find(function (err, items) {
        items.forEach(function (item) {
          describe(`${item.radicals} ${item.variant||'·'} (${item._id})`, function () {
            it('conforms to schema', function () {
              validate(item).should.be.true(formatErrors(validate.errors))
            })
          })
        })
        done()
      })
    })
  })

  describe('Lexemes', function () {
    var schema = JSON.parse(fs.readFileSync('public/schemas/lexeme.json'))
    var validate = ajv.compile(schema)

    it('receives data', function (done) {
      db.get('lexemes').find(function (err, items) {
        items.forEach(function (item) {
          describe(`${item.lemma} (${item._id})`, function () {
            it('conforms to schema', function () {
              validate(item).should.be.true(formatErrors(validate.errors))
            })
          })
        })
        done()
      })
    })
  })
})

function formatErrors (errors) {
  if (!errors) return null
  return errors.map(err => `${err.dataPath} ${err.message}`).join('\n')
}
