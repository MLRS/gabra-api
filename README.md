# API for Ġabra

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
- See <http://mlrs.research.um.edu.mt/resources/gabra-api/download> for data dumps you can use to get started.
  Use these with the `mongorestore` tool.
- After restoring data, you will need to create indices:

  ```sh
  $ cd scripts/nodes
  
  $ ./create-indexes.js
  creating 16 indexes

  $ ./run.js update-glosses-collection.js 
  Updating glosses collection...
  ...processed 29866 glosses from 19890 lexemes
  ```

## Running

Use PM2: `pm2 start processes.json` or just run the file `start.sh`.

You must set the environment variable `NODE_ENV` to `production` if relevant.

## Tests

The tests use:

1. [mocha](https://mochajs.org/) framework (`describe`, `it`, etc.)
2. [supertest](https://www.npmjs.com/package/supertest) for high-level HTTP testing (`request` etc.)
3. [should.js](https://shouldjs.github.io/) assertion library (`x.should.equal(y)` etc.)

Run all tests with `npm test`.
Run an individual testsuite with `npx mocha --exit test/schema.js` or use the `--grep` flag.
To stop on first failure, use `--bail`

### Using test data

Set `dbUrl` in `server-config.js` to `...gabra-test` (or something else)

```sh
node scripts/node/populate.js test/data/*.json
node scripts/node/resolve-lexeme-ids.js
node scripts/node/create-indexes.js
(cd scripts/node && ./run.js update-glosses-collection.js)
```

## Repository

- `master` branch is used for development.
- `production` branch is kept in sync with live version on MLRS.

### Deploying

Pushing to production will trigger a deploy via GitHub actions.

Assuming production can be fast-forwarded:

```sh
git push . master:production
git push origin production
```
