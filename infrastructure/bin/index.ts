#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Config, getConfig } from '../lib/config/config'
import { NeptuneDatabaseStack } from '../lib/stacks/neptune-database-stack';
import { NetworkingStack } from '../lib/stacks/networking-stack';

const app = new cdk.App();
let environmentName = app.node.tryGetContext('config');

const config: Config = getConfig(environmentName, './config/');
const env  = { account: config.Deployment.AWSAccountID, region: config.Deployment.AWSRegion };

const networkingStack = new NetworkingStack(app, `${config.Deployment.Prefix}-networking-stack`, { 
  env: env,
  deployment: config.Deployment,
  vpc: config.Vpc
});

new NeptuneDatabaseStack(app, `${config.Deployment.Prefix}-neptune-database`, { 
  env: env,
  deployment: config.Deployment,
  neptune: config.Neptune,
  vpc: networkingStack.vpc
});