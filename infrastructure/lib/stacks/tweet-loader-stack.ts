import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { EventFirehose } from '../constructs/event-firehose';
import { EventFirehoseConfig } from '../config/sections/event-firehose';
import { TweetProducer } from '../constructs/tweet-producer';
import { TwitterApiConfig } from '../config/sections/twitter-api';
import { TweetProducerConfig } from '../config/sections/tweet-producer';

export interface TweetLoaderStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly eventFirehoseConfig: EventFirehoseConfig;
  readonly tweetProducerConfig: TweetProducerConfig;
  readonly twitterApiConfig: TwitterApiConfig;
  readonly ecsCluster: ecs.Cluster
  readonly s3Bucket: s3.Bucket;
}

export class TweetLoaderStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: TweetLoaderStackProps) {
    super(scope, id, props);

    const firehose = new EventFirehose(this, 'tweet-firehose', {
      deployment: props.deployment,
      name: 'tweets',
      eventFirehoseConfig: props.eventFirehoseConfig,
      s3Bucket: props.s3Bucket
    });

    const producer = new TweetProducer(this, 'tweet-producer', {
      deployment: props.deployment,
      tweetProducerConfig: props.tweetProducerConfig,
      twitterApiConfig: props.twitterApiConfig,
      ecsCluster: props.ecsCluster,
      deliveryStream: firehose.deliveryStream,
    });
  }
}
