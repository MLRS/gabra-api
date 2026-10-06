#!/usr/bin/env node

// For generating hashed passwords to store in database
// Usage: generate-password.js 1234

var password = process.argv[2]
if (!password) {
  console.error('Empty password')
  process.exit(1)
}
var salted = process.env.SALT + password
var shasum = require('crypto').createHash('sha1')
var hashed = shasum.update(salted).digest('hex')
console.log(hashed)
