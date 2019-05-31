/* global print db */

/*
* Count the number of times each fields
*/
var f = function (coll) {
  print('Collection:', coll)
  var counts = {}
  var docCount = 0
  db.getCollection(coll).find({}).forEach(function (doc) {
    for (var field in doc) {
      if (!counts.hasOwnProperty(field)) {
        counts[field] = 0
      }
      counts[field]++
    }
    docCount++
  })
  print('Total documents:', docCount)
  for (var field in counts) {
    print(field, ':', counts[field])
  }
}

f('lexemes')
f('wordforms')
