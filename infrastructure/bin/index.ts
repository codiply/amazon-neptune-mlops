#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Config, getConfig } from '../lib/config/config'
import { NeptuneDatabaseStack } from '../lib/stacks/neptune-database-stack';
import { NeptuneNotebookStack } from '../lib/stacks/neptune-notebook-stack';
import { NetworkingStack } from '../lib/stacks/networking-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();
let environmentName = app.node.tryGetContext('config');

const config: Config = getConfig(environmentName, './config/');
const env  = { account: config.Deployment.AWSAccountID, region: config.Deployment.AWSRegion };

const networkingStack = new NetworkingStack(app, `${config.Deployment.Prefix}-networking-stack`, { 
  env: env,
  deployment: config.Deployment,
  vpcConfig: config.Vpc
});

const storageStack = new StorageStack(app, `${config.Deployment.Prefix}-storage-stack`, {
  env: env,
  deployment: config.Deployment,
  neptuneNotebookConfig: config.NeptuneNotebook,
  vpc: networkingStack.vpc
});

const neptuneDatabaseStack = new NeptuneDatabaseStack(app, `${config.Deployment.Prefix}-neptune-database-stack`, { 
  env: env,
  deployment: config.Deployment,
  neptuneConfig: config.Neptune,
  vpc: networkingStack.vpc
});

new NeptuneNotebookStack(app, `${config.Deployment.Prefix}-neptune-notebook-stack`, {
  env: env,
  deployment: config.Deployment,
  neptuneNotebookConfig: config.NeptuneNotebook,
  vpc: networkingStack.vpc,
  neptuneCluster: neptuneDatabaseStack.cluster,
  databaseClientSecurityGroup: neptuneDatabaseStack.databaseClientSecurityGroup,
  efsClientSecurityGroup: storageStack.neptuneNotebookEfsClientSecurityGroup,
  efsFileSystemId: storageStack.neptuneNotebookEfsFileSystemId,
});