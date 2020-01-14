#!/usr/bin/env node

var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

let promises = [
  db.get('glosses').createIndex({ lexeme_id: 1 }),
  db.get('glosses').createIndex({ glosses: 'text' }, { default_language: 'english' }),
  db.get('lexemes').createIndex({ lemma: 'text', alternatives: 'text' }, { default_language: 'none' }),
  db.get('lexemes').createIndex({ lemma: 1 }),
  db.get('lexemes').createIndex({ alternatives: 1 }),
  db.get('lexemes').createIndex({ 'glosses.gloss': 1 }),
  db.get('lexemes').createIndex({ sources: 1 }),
  db.get('lexemes').createIndex({ 'root.radicals': 1, 'root.variant': 1 }),
  db.get('logs').createIndex({ date: -1 }),
  db.get('messages').createIndex({ type: 1 }),
  db.get('roots').createIndex({ radicals: 1 }),
  db.get('roots').createIndex({ radicals: 1, variant: 1 }),
  db.get('sources').createIndex({ key: 1 }),
  db.get('wordforms').createIndex({ lexeme_id: 1 }),
  db.get('wordforms').createIndex({ surface_form: 1 }),
  db.get('wordforms').createIndex({ alternatives: 1 })
]

const count = promises.length
console.log(`creating ${count} indexes`)

Promise.all(promises).then(() => {
  process.exit(0)
})
