import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import { DeploymentConfig } from '../config/deployment-config';
import { CommonConfig } from '../config/sections/common';
import { GremlinCsvConverter } from '../constructs/gremlin-csv-converter';
import { GremlinCsvConfig } from '../config/sections/gremlin-csv';
import { GremlinCsvConverterConfig } from '../config/sections/gremlin-csv-converter';
import { LambdaLayersVersions } from './lambda-layers';
import { WikimediaEventsConfig } from '../config/sections/wikimedia-events';

export interface WikimediaEventsGremlinCsvConverterProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly gremlinCsvConfig: GremlinCsvConfig;
  readonly gremlinCsvConverterConfig: GremlinCsvConverterConfig;
  readonly wikimediaEventsConfig: WikimediaEventsConfig;
  readonly s3Bucket: s3.Bucket;
  readonly loaderQueue: sqs.Queue;
  readonly lambdaLayersVersions: LambdaLayersVersions;
}

export class WikimediaEventsGremlinCsvConverterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: WikimediaEventsGremlinCsvConverterProps) {
    super(scope, id, props);
    new GremlinCsvConverter(this, 'gremlin-csv-converter', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      gremlinCsvConfig: props.gremlinCsvConfig,
      gremlinCsvConverter: props.gremlinCsvConverterConfig,
      eventsName: 'wikimedia-events',
      pathPrefix: props.wikimediaEventsConfig.S3PathPrefix,
      s3Bucket: props.s3Bucket,
      loaderQueue: props.loaderQueue,
      convertersLayerAssetPath: './assets/lambda-layers/gremlin-csv-converter-wikimedia-events',
      xrayLambdaLayer: props.lambdaLayersVersions.xray
    });
  }
}
