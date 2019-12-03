/* global db print */

// Output some generic statistics about databse

// Lexemes
let ls

ls = db.lexemes.count()
print('Lexemes: ' + ls)

ls = db.lexemes.count({pos: {$nin: ['', null]}})
print('Lexemes with POS: ' + ls)

ls = db.lexemes.count({gloss: {$nin: ['', null]}})
print('Lexemes with gloss: ' + ls)

ls = db.lexemes.count({pos: {$nin: ['', null]}, gloss: {$nin: ['', null]}})
print('Lexemes with POS and gloss: ' + ls)

print('Lexemes by source:')
db.sources.find().forEach(function (s) {
  var ls = db.lexemes.count({sources: s.key})
  print('  ' + s.key + ': ' + ls)
})

print('')

// Wordforms
ls = db.wordforms.count()
print('Wordforms: ' + ls)

print('Wordforms by source:')
db.sources.find().forEach(function (s) {
  var ws = db.wordforms.count({sources: s.key})
  print('  ' + s.key + ': ' + ws)
})
