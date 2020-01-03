// Remove wordforms with non-existent lexeme (orphans)
/* global db printjson */

var lids = db.lexemes.distinct('_id')
var conds = {lexeme_id: {'$nin': lids}}
print(db.wordforms.count(conds))
db.wordforms.find(conds).forEach(printjson)
// db.wordforms.remove(conds)
