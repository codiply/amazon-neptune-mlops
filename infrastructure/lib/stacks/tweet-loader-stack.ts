import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { TweetFirehose } from '../constructs/tweet-firehose';
import { TweetFirehoseConfig } from '../config/sections/tweet-firehose';

export interface TweetLoaderStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly tweetFirehoseConfig: TweetFirehoseConfig;
  readonly ecsCluster: ecs.Cluster
  readonly s3Bucket: s3.Bucket;
}

export class TweetLoaderStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: TweetLoaderStackProps) {
    super(scope, id, props);

    const firehose = new TweetFirehose(this, 'tweet-firehose', {
      deployment: props.deployment,
      tweetFirehoseConfig: props.tweetFirehoseConfig,
      s3Bucket: props.s3Bucket
    });
  }
}
