import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import { DeploymentConfig } from '../config/deployment-config';
import { CommonConfig } from '../config/sections/common';
import { TweetsConfig } from '../config/sections/tweets';
import { GremlinCsvConverter } from '../constructs/gremlin-csv-converter';
import { GremlinCsvConfig } from '../config/sections/gremlin-csv';
import { GremlinCsvConverterConfig } from '../config/sections/gremlin-csv-converter';
import { LambdaLayersVersions } from './lambda-layers';

export interface TweetsGremlinCsvConverterProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly gremlinCsvConfig: GremlinCsvConfig;
  readonly gremlinCsvConverterConfig: GremlinCsvConverterConfig;
  readonly tweetsConfig: TweetsConfig;
  readonly s3Bucket: s3.Bucket;
  readonly loaderQueue: sqs.Queue;
  readonly lambdaLayersVersions: LambdaLayersVersions;
}

export class TweetsGremlinCsvConverterStack extends cdk.Stack {
  private props: TweetsGremlinCsvConverterProps;

  constructor(scope: cdk.App, id: string, props: TweetsGremlinCsvConverterProps) {
    super(scope, id, props);

    this.props = props;

    const policyStatements = this.definePolicyStatements()

    new GremlinCsvConverter(this, 'gremlin-csv-converter', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      gremlinCsvConfig: props.gremlinCsvConfig,
      gremlinCsvConverter: props.gremlinCsvConverterConfig,
      eventsName: 'tweets',
      pathPrefix: props.tweetsConfig.S3PathPrefix,
      s3Bucket: props.s3Bucket,
      loaderQueue: props.loaderQueue,
      policyStatements: policyStatements,
      lambdaLayersVersions: props.lambdaLayersVersions 
    });
  }

  private definePolicyStatements(): iam.PolicyStatement[] {
    return [];
  }
}
