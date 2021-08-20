import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { EventFirehose } from '../constructs/event-firehose';
import { EventFirehoseConfig } from '../config/sections/event-firehose';
import { WikimediaEventsProducerConfig } from '../config/sections/wikimedia-events-producer';
import { WikimediaEventsProducer } from '../constructs/wikimedia-events-producer';

export interface WikimediaEventsToS3StackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly eventFirehoseConfig: EventFirehoseConfig;
  readonly wikimediaEventsProducerConfig: WikimediaEventsProducerConfig;
  readonly ecsCluster: ecs.Cluster
  readonly s3Bucket: s3.Bucket;
}

export class WikimediaEventsToS3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: WikimediaEventsToS3StackProps) {
    super(scope, id, props);

    const firehose = new EventFirehose(this, 'firehose', {
      deployment: props.deployment,
      name: 'wikimedia-events',
      eventFirehoseConfig: props.eventFirehoseConfig,
      s3Bucket: props.s3Bucket
    });

    const producer = new WikimediaEventsProducer(this, 'producer', {
      deployment: props.deployment,
      wikimediaEventsProducerConfig: props.wikimediaEventsProducerConfig,
      ecsCluster: props.ecsCluster,
      deliveryStream: firehose.deliveryStream,
    });
  }
}
