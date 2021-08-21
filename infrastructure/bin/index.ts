#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Config, getConfig } from '../lib/config/config'
import { NeptuneDatabaseStack } from '../lib/stacks/neptune-database-stack';
import { NeptuneNotebookStack } from '../lib/stacks/neptune-notebook-stack';
import { BaseStack } from '../lib/stacks/base-stack';
import { WikimediaEventsToS3Stack } from '../lib/stacks/wikimedia-events-to-s3-stack';

const app = new cdk.App();
let environmentName = app.node.tryGetContext('config');

const config: Config = getConfig(environmentName, './config/');
const env  = { account: config.Deployment.AWSAccountID, region: config.Deployment.AWSRegion };

const baseStack = new BaseStack(app, `${config.Deployment.Prefix}-base-stack`, {
  env: env,
  deployment: config.Deployment,
  vpcConfig: config.Vpc,
  neptuneNotebookEfsConfig: config.NeptuneNotebookEfs,
  ecsClusterConfig: config.EcsCluster
});

const neptuneDatabaseStack = new NeptuneDatabaseStack(app, `${config.Deployment.Prefix}-neptune-database-stack`, { 
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  neptuneConfig: config.Neptune,
  gremlinCsvLoaderConfig: config.GremlinCsvLoader,
  vpc: baseStack.vpc,
  ecsCluster: baseStack.ecsCluster,
  s3Bucket: baseStack.s3Bucket
});

new NeptuneNotebookStack(app, `${config.Deployment.Prefix}-neptune-notebook-stack`, {
  env: env,
  deployment: config.Deployment,
  neptuneNotebookConfig: config.NeptuneNotebook,
  vpc: baseStack.vpc,
  neptuneCluster: neptuneDatabaseStack.cluster,
  databaseClientSecurityGroup: neptuneDatabaseStack.databaseClientSecurityGroup,
  efsClientSecurityGroup: baseStack.neptuneNotebookEfsClientSecurityGroup,
  efsFileSystemId: baseStack.neptuneNotebookEfsFileSystemId,
});

new WikimediaEventsToS3Stack(app, `${config.Deployment.Prefix}-wikimedia-events-to-s3`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  eventFirehoseConfig: config.EventFirehose,
  wikimediaEventsProducerConfig: config.WikimediaEventsProducer,
  ecsCluster: baseStack.ecsCluster,
  s3Bucket: baseStack.s3Bucket
});