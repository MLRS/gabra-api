#!/usr/bin/env node

var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

let promises = [
  db.get('lexemes').createIndex({ lemma: 'text', alternatives: 'text' }),
  db.get('lexemes').createIndex({ lemma: 1 }),
  db.get('lexemes').createIndex({ alternatives: 1 }),
  db.get('lexemes').createIndex({ 'glosses.gloss': 1 })
]

Promise.all(promises).then(() => {
  process.exit(0)
})
