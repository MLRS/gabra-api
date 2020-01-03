/* global db printjson */
db.lexemes.aggregate(
  { $group: { _id: '$lemma', total: {$sum: 1}, ids: {$push: '$_id'} } },
  { $match: { total: { $gte: 2 } } },
  { $sort: {total: -1} }
).forEach(printjson)
