#!/usr/bin/env node

// Look in all wordforms, and replace `lexeme` fields of this type:
// lexeme: {
//   lemma: 'kiteb',
//   pos: 'NOUN'
// }
// With lexeme_id fields

var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

const coll_l = db.get('lexemes')
const coll_wf = db.get('wordforms')

coll_wf.find({'lexeme': {$exists: true}, 'lexeme_id': {$exists: false}}).then((data) => {
  let promises = []
  for (let wf of data) {
    promises.push(coll_l.findOne(wf.lexeme).then((lex) => {
      if (lex) {
        return coll_wf.update(wf._id, {
          $set: {
            lexeme_id: lex._id
          },
          $unset: {
            lexeme: true
          }
        })
      }
    }))
  }
  Promise.all(promises).then(() => {
    process.exit(0)
  })
})
