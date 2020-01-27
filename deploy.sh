#!/bin/sh

LOCALDIR=.
# HOST=mlrs.research.um.edu.mt
# REMOTEDIR=/var/www/resources/gabra-api/
HOST=10.249.1.100
REMOTEDIR=/var/www/public_html/resources/gabra-api/
FLAGS="--recursive --checksum --compress --verbose --exclude-from=deploy-exclude.txt --log-file=deploy.log"

set -e

echo "Deploy Ġabra API"
if [ "$1" = "-wet" ]; then
  echo "(For real)"
  rsync ${FLAGS} ${LOCALDIR} ${HOST}:${REMOTEDIR}
  echo
  echo "Running npm install..."
  ssh ${HOST} "cd ${REMOTEDIR} && npm install"
  echo
  echo "Starting service..."
  ssh pm2@${HOST} "cd ${REMOTEDIR} && ./start.sh"
else
  echo "(Dry-run)"
  rsync --dry-run --delete ${FLAGS} ${LOCALDIR} ${HOST}:${REMOTEDIR}
  echo
  echo "### This was just a dry-run. To push for real, use the flag '-wet' ###"
fi
