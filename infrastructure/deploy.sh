#!/bin/bash

set -euo pipefail

./cdk.sh deploy '*-iam-roles'
./cdk.sh deploy '*-base'
./cdk.sh deploy '*-database'
./cdk.sh deploy '*-lambda-layers'
./cdk.sh deploy '*-tweets-to-s3'
./cdk.sh deploy '*-tweets-gremlin-csv-converter'