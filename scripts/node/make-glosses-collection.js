#!/usr/bin/env node

/*
 * Populate glosses collection, which serves as an index from gloss to lexeme.
 * The glosses collection is used specifically by the search_glosses API call.
 * This script should be run periodicllay on a cron job or similar
 * although it is rather slow (~at least a few minutes)
 */

var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

const coll = db.get('glosses')

Promise.all([
  // set up indices
  // do this already now since we are querying the glosses collection in the loop below
  coll.createIndex({gloss: 'text'}),
  coll.createIndex({length: -1})
]).then(() => {
  // iterate over all lexemes with a gloss
  const conds = {
    'glosses': {
      '$exists': true
    }
  }
  db.get('lexemes').find(conds).then((data) => {
    let promises = []
    for (let lex of data) {
      for (let glossitem of lex.glosses) {
        if (!glossitem.gloss) continue
        let g = glossitem.gloss.toLowerCase()

        // check if gloss is in the collection already
        promises.push(coll.findOne({'gloss': g}).then((entry) => {
          if (entry === null) {
            return coll.insert({
              'gloss': g,
              'length': g.length,
              'lexemes': [lex._id]
            })
          } else {
            return coll.update(
              {'gloss': g},
              {'$addToSet': {'lexemes': lex._id}}
            )
          }
        }))
      }
    }

    Promise.all(promises).then(() => {
      process.exit(0)
    })
  })
})
