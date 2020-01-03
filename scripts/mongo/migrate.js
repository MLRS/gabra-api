/* global db load print */

// Migrate DB from old MLRS server to new one, ca 2019
// Corresponding to API version 2.9 to 2.10

print('Removing all non-i18n messages...')
db.getCollection('messages').remove({$or: [{type: 'news'}, {type: 'web'}]})

print('Removing old collections...')
db.getCollection('duplicate_lemmas').drop()

print('Converting gloss field to glosses...')
db.getCollection('lexemes').update({'gloss': ''}, {'$unset': {'gloss': true}}, {'multi': true})
db.getCollection('lexemes').update({'gloss': {$exists: true, $eq: null}}, {'$unset': {'gloss': true}}, {'multi': true})
db.getCollection('lexemes').find({'gloss': {'$exists': true}, 'glosses': {'$exists': false}}).forEach(function (e) {
  e.glosses = [{'gloss': e.gloss}]
  delete e.gloss
  db.lexemes.save(e)
})

print('Rebuilding glosses index...')
db.getCollection('lexemes').dropIndex('gloss_1')
db.getCollection('lexemes').createIndex({'glosses.gloss': 1.0})

print('Rebuilding glosses collection...')
db.getCollection('glosses').drop()
load('./make-glosses-collection.js')

print('Data cleanup...')
load('./schema-fixes.js')

print('Done')
