/* global db printjson print */
var coll = db.getCollection('lexemes')
coll.aggregate([
  {$group: {
    _id: {lemma: '$lemma', pos: '$pos'},
    ids: {$addToSet: '$_id'},
    count: {$sum: 1}
  }},
  {$match: {count: {'$gte': 2}}},
  {$sort: {'_id.lemma': 1}}
]).forEach((entry) => {
  coll.find({_id: {$in: entry.ids}}).forEach(printjson)
  print('----------')
})
