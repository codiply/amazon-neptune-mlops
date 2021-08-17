#!/bin/bash

set -euo pipefail

MY_IP=$(curl -s ifconfig.me/ip)

for filename in ./config/*.deployment.yaml; do
  sed -i '' -E "s/- '[^']*' # AUTO_FILL_MY_IP_ADDRESS/- '$MY_IP\/32' # AUTO_FILL_MY_IP_ADDRESS/g" $filename
done

cdk --profile $(cat ./config/aws-profile.txt) "${@}"
