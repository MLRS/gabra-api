/* Fixes to data as a result of schema testing
 * 2019-05-31
 */

// alternatives: ''
db.getCollection('lexemes').update({alternatives:''},{$unset:{'alternatives':true}},{multi:true})

// alternatives: []
db.getCollection('lexemes').update({alternatives:[]},{$unset:{'alternatives':true}},{multi:true})

// gender: null
db.getCollection('lexemes').update({gender:{$exists:true, $eq:null}},{$unset:{'gender':true}},{multi:true})

// gender: ''
db.getCollection('lexemes').update({gender:''},{$unset:{'gender':true}},{multi:true})

// pos: ''
db.getCollection('lexemes').update({pos:''},{$unset:{'pos':true}},{multi:true})

// root: null
db.getCollection('lexemes').update({root:{$exists:true, $eq:null}},{$unset:{'root':true}},{multi:true})

// pending: ''
db.getCollection('lexemes').update({pending:''},{$unset:{'pending':true}},{multi:true})

// pending: '1'
db.getCollection('lexemes').update({pending:'1'},{$set:{'pending':true}},{multi:true})
