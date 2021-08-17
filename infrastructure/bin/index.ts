#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Config, getConfig } from '../lib/config/config'
import { CoreStack } from '../lib/stacks/core-stack';

const app = new cdk.App();
let environmentName = app.node.tryGetContext('config');

const config: Config = getConfig(environmentName, './config/');
const env  = { account: config.Deployment.AWSAccountID, region: config.Deployment.AWSRegion };

const prefix = config.Deployment.Prefix

new CoreStack(app, `${prefix}-core-stack`, { 
  env: env,
  config: config
});