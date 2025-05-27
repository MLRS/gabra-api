#!/usr/bin/env node

// For adding user to database
// Usage: add-user.js username password

if (process.argv.length < 4) {
  console.error('Usage: add-user.js username password')
  process.exit(1)
}

var config = require('../../server-config')
var monk = require('monk')
var db = monk(config.dbUrl)

const username = process.argv[2]
const password = process.argv[3]
const salted = config.salt + password
const shasum = require('crypto').createHash('sha1')
const hashed = shasum.update(salted).digest('hex')

let promises = [
  db.get('users').insert({
    username,
    password: hashed
  }).then(() => {
    console.log(`User ${username} added`)
  })
]

Promise.all(promises).then(() => {
  process.exit(0)
})
