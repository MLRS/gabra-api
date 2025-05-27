#!/usr/bin/env node

// Run a JS module from a CLI
// Usage:
// scripts/node/run.js scripts/node/update-glosses-collection.js

// Module should export a function which takes db as argument and returns a promise

var path = require('path')
var fs = require('fs')

if (process.argv.length < 3) {
  console.error(`Must specify input script`)
  process.exit(1)
}

var script = path.resolve(process.argv[2])
if (!fs.existsSync(script)) {
  console.error(`File does not exist: ${script}`)
  process.exit(1)
}

var config = require('../../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

var fun = require(script)
fun(db).then(() => {
  process.exit(0)
}).catch(() => {
  process.exit(1)
})
