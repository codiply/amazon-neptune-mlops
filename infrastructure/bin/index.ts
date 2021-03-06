#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Config, getConfig } from '../lib/config/config'
import { NeptuneDatabaseStack } from '../lib/stacks/neptune-database-stack';
import { NeptuneNotebookStack } from '../lib/stacks/neptune-notebook-stack';
import { BaseStack } from '../lib/stacks/base-stack';
import { WikimediaEventsToS3Stack } from '../lib/stacks/wikimedia-events-to-s3-stack';
import { TweetsToS3Stack } from '../lib/stacks/tweets-to-s3-stack';
import { WikimediaEventsGremlinCsvConverterStack } from '../lib/stacks/wikimedia-events-gremlin-csv-converter';
import { LambdaLayersStack } from '../lib/stacks/lambda-layers';
import { TweetsGremlinCsvConverterStack } from '../lib/stacks/tweets-gremlin-csv-converter';
import { IamRolesStack } from '../lib/stacks/iam-roles';
import { MlPipelineStack } from '../lib/stacks/ml-pipeline-stack';

const app = new cdk.App();
let environmentName = app.node.tryGetContext('config');

const config: Config = getConfig(environmentName, './config/');
const env  = { account: config.Deployment.AWSAccountID, region: config.Deployment.AWSRegion };

const baseStack = new BaseStack(app, `${config.Deployment.Prefix}-base`, {
  env: env,
  deployment: config.Deployment,
  vpcConfig: config.Vpc,
  neptuneNotebookEfsConfig: config.NeptuneNotebookEfs,
  ecsClusterConfig: config.EcsCluster
});

const lambdaLayers = new LambdaLayersStack(app, `${config.Deployment.Prefix}-lambda-layers`, {
  env: env,
  deployment: config.Deployment
});

const iamRoles = new IamRolesStack(app, `${config.Deployment.Prefix}-iam-roles`, {
  env: env,
  deployment: config.Deployment
});

const neptuneDatabaseStack = new NeptuneDatabaseStack(app, `${config.Deployment.Prefix}-neptune-database`, { 
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  neptuneConfig: config.Neptune,
  gremlinCsvLoaderConfig: config.GremlinCsvLoader,
  vpc: baseStack.vpc,
  ecsCluster: baseStack.ecsCluster,
  s3Bucket: baseStack.s3Bucket,
  neptuneSagemakerRole: iamRoles.roles.neptuneSagemakerRole,
  sagemakerExecutionRole: iamRoles.roles.sagemakerExecutionRole,
  sagemakerVpcEndpointClientSecurityGroup: baseStack.sagemakerVpcEndpointClientSecurityGroup
});

new NeptuneNotebookStack(app, `${config.Deployment.Prefix}-neptune-notebook`, {
  env: env,
  deployment: config.Deployment,
  neptuneNotebookConfig: config.NeptuneNotebook,
  vpc: baseStack.vpc,
  neptuneCluster: neptuneDatabaseStack.cluster,
  databaseClientSecurityGroup: neptuneDatabaseStack.databaseClientSecurityGroup,
  efsClientSecurityGroup: baseStack.neptuneNotebookEfsClientSecurityGroup,
  efsFileSystemId: baseStack.neptuneNotebookEfsFileSystemId,
});

new TweetsToS3Stack(app, `${config.Deployment.Prefix}-tweets-to-s3`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  eventFirehoseConfig: config.EventFirehose,
  tweetsConfig: config.Tweets,
  tweetsProducerConfig: config.TweetsProducer,
  twitterApiConfig: config.TwitterApi,
  ecsCluster: baseStack.ecsCluster,
  s3Bucket: baseStack.s3Bucket
});

new TweetsGremlinCsvConverterStack(app, `${config.Deployment.Prefix}-tweets-gremlin-csv-converter`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  gremlinCsvConfig: config.GremlinCsv,
  gremlinCsvConverterConfig: config.GremlinCsvConverter,
  tweetsConfig: config.Tweets,
  tweetsGremlinCsvConverterConfig: config.TweetsGremlinCsvConverter,
  s3Bucket: baseStack.s3Bucket,
  loaderQueue: neptuneDatabaseStack.loaderQueue,
  lambdaLayersVersions: lambdaLayers.versions
});

new WikimediaEventsToS3Stack(app, `${config.Deployment.Prefix}-wikimedia-events-to-s3`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  eventFirehoseConfig: config.EventFirehose,
  wikimediaEventsConfig: config.WikimediaEvents,
  wikimediaEventsProducerConfig: config.WikimediaEventsProducer,
  ecsCluster: baseStack.ecsCluster,
  s3Bucket: baseStack.s3Bucket
});

new WikimediaEventsGremlinCsvConverterStack(app, `${config.Deployment.Prefix}-wikimedia-events-gremlin-csv-converter`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  gremlinCsvConfig: config.GremlinCsv,
  gremlinCsvConverterConfig: config.GremlinCsvConverter,
  wikimediaEventsConfig: config.WikimediaEvents,
  s3Bucket: baseStack.s3Bucket,
  loaderQueue: neptuneDatabaseStack.loaderQueue,
  lambdaLayersVersions: lambdaLayers.versions
});

new MlPipelineStack(app, `${config.Deployment.Prefix}-ml-pipeline`, {
  env: env,
  deployment: config.Deployment,
  commonConfig: config.Common,
  neptuneExporterConfig: config.NeptuneExporter,
  ecsCluster: baseStack.ecsCluster,
  databaseClusterEndpoint: neptuneDatabaseStack.cluster.clusterEndpoint,
  databaseClientSecurityGroup: neptuneDatabaseStack.databaseClientSecurityGroup,
});