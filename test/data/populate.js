var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

const collections = ['lexemes', 'roots']

let promises = []

for (let coll of collections) {
  let data = require(`./${coll}.json`)
  // let p = db.get(coll).drop().then(() => db.get(coll).insert(data))
  let p = db.get(coll).insert(data)
  promises.push(p)
}

Promise.all(promises).then(() => process.exit(0))
