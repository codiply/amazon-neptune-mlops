import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { EventFirehose } from '../constructs/event-firehose';
import { EventFirehoseConfig } from '../config/sections/event-firehose';
import { WikimediaEventsProducer } from '../constructs/wikimedia-events-producer';
import { CommonConfig } from '../config/sections/common';
import { TweetsConfig } from '../config/sections/tweets';
import { TweetsProducerConfig } from '../config/sections/tweets-producer';
import { TweetsProducer } from '../constructs/tweets-producer';
import { TwitterApiConfig } from '../config/sections/twitter-api';

export interface TweetsToS3StackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly eventFirehoseConfig: EventFirehoseConfig;
  readonly tweetsConfig: TweetsConfig;
  readonly tweetsProducerConfig: TweetsProducerConfig;
  readonly twitterApiConfig: TwitterApiConfig;
  readonly ecsCluster: ecs.Cluster
  readonly s3Bucket: s3.Bucket;
}

export class TweetsToS3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: TweetsToS3StackProps) {
    super(scope, id, props);

    const firehose = new EventFirehose(this, 'firehose', {
      deployment: props.deployment,
      name: 'tweets',
      eventFirehoseConfig: props.eventFirehoseConfig,
      s3Bucket: props.s3Bucket,
      pathPrefix: props.tweetsConfig.S3PathPrefix
    });

    const producer = new TweetsProducer(this, 'producer', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      tweetsProducerConfig: props.tweetsProducerConfig,
      twitterApiConfig: props.twitterApiConfig,
      ecsCluster: props.ecsCluster,
      deliveryStream: firehose.deliveryStream,
    });
  }
}
