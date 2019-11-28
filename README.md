API for Ġabra
-------------

Ġabra is an open lexicon for Maltese.

This repository contains the source code for the Ġabra API at
<http://mlrs.research.um.edu.mt/resources/gabra-api/>


## Installation

### Web app

- You need [Node.js](https://nodejs.org). After cloning the repo run `npm install` to install Node packages locally.
- You will need a file `server-config.js` containing the relevant details for your host.
  Start by copying `server-config.sample.js`.

### Database

- You will need a MongoDB installation.
  See <http://mlrs.research.um.edu.mt/resources/gabra-api/download> for data dumps you can use to get started.
  TODO: non-data tables

## Running

Use PM2: `pm2 start processes.json` or just run the file `start.sh`.

## Tests

The tests use:

1. [mocha](https://mochajs.org/) framework (`describe`, `it`, etc.)
2. [supertest](https://www.npmjs.com/package/supertest) for high-level HTTP testing (`request` etc.)
3. [should.js](https://shouldjs.github.io/) assertion library (`x.should.equal(y)` etc.)

Run all tests with `npm test`.
Run an individual testsuite with `npx mocha --exit test/schema.js` or use the `--grep` flag.
To stop on first failure, use `--bail`

### Tests to be added

- Searching for roots by only type (should be fixed in b9c5179)
- Load non-existant lexeme/root (`/roots/ż-m-ż-m`) should return 404
