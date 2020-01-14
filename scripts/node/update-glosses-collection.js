#!/usr/bin/env node

/*
 * Populate glosses collection, which serves as an index from gloss to lexeme.
 * The glosses collection is used specifically by the search_glosses API call.
 * This script should be run periodicllay on a cron job or similar.
 */

module.exports = function (db) {
  console.log(`Updating glosses collection...`)

  const coll = db.get('glosses')
  const conds = {
    'glosses': {
      '$exists': true
    }
  }
  return db.get('lexemes').find(conds).then((data) => {
    let promises = []
    let lexCount = 0
    let glossCount = 0
    for (let lex of data) {
      lexCount++
      let gs = lex.glosses.map(g => g.gloss)
      glossCount += lex.glosses.length
      promises.push(coll.update({lexeme_id: lex._id}, {$set: {glosses: gs}}, {upsert: true}))
    }

    return Promise.all(promises).then(() => {
      console.log(`...processed ${glossCount} glosses from ${lexCount} lexemes`)
    })
  })
}
