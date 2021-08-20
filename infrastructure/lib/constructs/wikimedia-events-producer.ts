import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import { DeploymentConfig } from '../config/deployment-config';
import { EcsService } from './ecs-service';
import { WikimediaEventsProducerConfig } from '../config/sections/wikimedia-events-producer';

export interface WikimediaEventsProducerProps {
  readonly deployment: DeploymentConfig;
  readonly wikimediaEventsProducerConfig: WikimediaEventsProducerConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly deliveryStream: firehose.DeliveryStream;
}
  
export class WikimediaEventsProducer extends cdk.Construct {
  private readonly props: WikimediaEventsProducerProps;

  constructor(scope: cdk.Construct, id: string, props: WikimediaEventsProducerProps) {
    super(scope, id);

    this.props = props;

    const policyStatements = this.defineTaskRolePolicyStatements();

    const environment = {
      DELIVERY_STREAM_NAME: this.props.deliveryStream.deliveryStreamName
    };

    new EcsService(this, 'tweet-producer-ecs-service', {
      deployment: props.deployment,
      ecsCluster: props.ecsCluster,
      serviceName: 'wikimedia-events-producer',
      memoryLimitMiB: props.wikimediaEventsProducerConfig.MemoryLimitMiB,
      cpu: props.wikimediaEventsProducerConfig.Cpu,
      policyStatements: policyStatements,
      containerImageDirectory: './assets/containers/wikimedia-events-producer/',
      environment: environment,
      desiredCount: 1,
      enableXray: true
    });
  }

  private defineTaskRolePolicyStatements(): iam.PolicyStatement[] {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'firehose:PutRecord'
        ],
        resources: [
          this.props.deliveryStream.deliveryStreamArn
        ]
      })
    ];
  }
}