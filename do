#!/bin/bash

set -euo pipefail

trap 'echo "Sorry, failed..."; exit 1' ERR

cd "$(cd "$(dirname "$0")")"

if [ -z "$(docker images -q superhero/dns 2>/dev/null)" ]; then
  docker build -t superhero/dns .
fi

docker run -d --name dns -p 53:53/tcp -p 53:53/udp --volume /var/run/docker.sock:/var/run/docker.sock:ro superhero/dns

echo
echo "DNS server started!"