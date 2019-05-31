/* globals describe it */

require('should')
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
    datetime: () => true
  }
}) // https://www.npmjs.com/package/ajv#options

/* Tests data against schemas */
describe('Schema', () => {
  describe('Roots', () => {
    var schema = JSON.parse(fs.readFileSync('public/schemas/root.json'))
    var validate = ajv.compile(schema)

    it('receives data', async () => {
      let items = await db.get('roots').find()
      items.forEach((item) => {
        describe(`${item.radicals} ${item.variant || '·'} (${item._id})`, () => {
          it('conforms to schema', () => {
            validate(item).should.be.true(formatErrors(validate.errors))
          })
        })
      })
    })
  })

  describe('Lexemes', () => {
    var schema = JSON.parse(fs.readFileSync('public/schemas/lexeme.json'))
    var validate = ajv.compile(schema)

    it('receives data', async () => {
      let items = await db.get('lexemes').find()
      items.forEach((item) => {
        describe(`${item.lemma} (${item._id})`, () => {
          it('conforms to schema', () => {
            validate(item).should.be.true(formatErrors(validate.errors))
          })
        })
      })
    })
  })

  describe('Wordforms', () => {
    var schema = JSON.parse(fs.readFileSync('public/schemas/wordform.json'))
    var validate = ajv.compile(schema)

    it('receives data', async () => {
      let items = await db.get('wordforms').find()
      items.forEach((item) => {
        describe(`${item.surface_form} (${item._id})`, () => {
          it('conforms to schema', () => {
            validate(item).should.be.true(formatErrors(validate.errors))
          })
        })
      })
    })
  })
})

function formatErrors (errors) {
  if (!errors) return null
  return errors.map(err => `${err.dataPath} ${err.message}`).join('\n')
}
