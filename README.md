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
