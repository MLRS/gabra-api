/* global db */
/* eslint-disable camelcase */

/*
 * Populate glosses collection, which serves as an index from gloss to lexeme.
 * The glosses collection is used specifically by the search_glosses API call.
 * This script should be run periodicllay on a cron job or similar
 * although it is rather slow (~at least a few minutes)
 */

const COLL = 'glosses'

// create the collection if not existing
if (db.getCollectionNames().indexOf(COLL) < 0) {
  db.createCollection(COLL)

  // set up indices
  // do this already now since we are querying the glosses collection in the loop below
  // db.getCollection(COLL).createIndex({gloss: 'text'}, {score: {$meta: 'textScore'}})
  db.getCollection(COLL).createIndex({gloss: 'text'})
  db.getCollection(COLL).createIndex({length: -1})
}

// iterate over all lexemes with a gloss
const conds = {
  'glosses': {
    '$exists': true
  }
}
db.getCollection('lexemes').find(conds).forEach(function (lex) {
  for (let glossitem of lex.glosses) {
    if (!glossitem.gloss) continue
    let g = glossitem.gloss.toLowerCase()

    // check if gloss is in the collection already
    let entry = db.getCollection(COLL).findOne({'gloss': g})

    if (entry == null) {
      db.getCollection(COLL).insert({
        'gloss': g,
        'length': g.length,
        'lexemes': [lex._id]
      })
    } else {
      db.getCollection(COLL).update(
        {'gloss': g},
        {'$addToSet': {'lexemes': lex._id}}
      )
    }
  }
})
