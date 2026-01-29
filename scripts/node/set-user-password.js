#!/usr/bin/env node

// For updating user password
// Usage: set-user-password.js username password

if (process.argv.length < 4) {
  console.error('Usage: set-user-password.js username password')
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
  db.get('users').findOneAndUpdate(
    { username },
    { $set: { password: hashed } }
  ).then(() => {
    console.log(`Password for user ${username} updated`)
  })
]

Promise.all(promises).then(() => {
  process.exit(0)
})
