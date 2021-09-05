#!/bin/bash

set -euo pipefail

MY_IP=$(curl -s ifconfig.me/ip)
AWS_PROFILE=$(cat ./config/aws-profile.txt)

for filename in ./config/*.deployment.yaml; do
  sed -i '' -E "s/- '[^']*' # AUTO_FILL_MY_IP_ADDRESS/- '$MY_IP\/32' # AUTO_FILL_MY_IP_ADDRESS/g" $filename
done

aws ecr-public get-login-password --region us-east-1 --profile $AWS_PROFILE | docker login --username AWS --password-stdin public.ecr.aws

cdk --profile $AWS_PROFILE "${@}"
