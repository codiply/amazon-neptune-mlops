# Infrastructure CDK project

- Install node packages `npm install`
- Setup the configuration using the templates in `config/`
- Deploy `./cdk.sh deploy`

## Manual steps

Store Twitter API credentials in SSM Parameter Store

- `/twitter-api/consumer-key`
- `/twitter-api/consumer-secret`
- `/twitter-api/access-token`
- `/twitter-api/access-token-secret`