import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { DeploymentConfig } from '../config/deployment-config';

export interface TweetProducerProps {
  readonly deployment: DeploymentConfig;
  readonly ecsCluster: ecs.Cluster;
}
  
export class TweetProducer extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: TweetProducerProps) {
    super(scope, id);

  }
}