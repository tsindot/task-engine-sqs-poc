#!/usr/bin/env bash

printf "Configuring localstack components..."

sleep 5;
set -x

aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test

echo "[default]" > ~/.aws/config
echo "region = us-west-2" >> ~/.aws/config
echo "output = json" >> ~/.aws/config

set +x

printf "Localstack dashboard : http://localhost:8080/#!/infra"