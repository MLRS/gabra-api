#!/usr/bin/env node

// Usage:
// node scripts/node/populate test/data/*.json
//
// Filename is used as collection.
// Non-JSON files are ignored.

var path = require('path')
var fs = require('fs')
var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

let promises = []

for (let arg of process.argv) {
  if (!arg.endsWith('.json')) continue
  if (!fs.existsSync(arg)) {
    console.error(`Path does not exist: ${arg}`)
    continue
  }
  let raw = fs.readFileSync(arg)
  let data = JSON.parse(raw)
  let coll = path.parse(arg).name
  let count = Array.isArray(data) ? data.length : 1
  console.log(`${count} ${coll}`)
  promises.push(db.get(coll).insert(data))
}

Promise.all(promises).then(() => {
  process.exit(0)
})
