import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Networking } from '../constructs/networking';
import { VpcConfig } from '../config/sections/vpc';
import { DeploymentConfig } from '../config/deployment-config';

export interface NetworkingStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig
  readonly vpc: VpcConfig;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    const networking = new Networking(this, 'networking', {
      deployment: props.deployment,
      config: props.vpc
    });

    this.vpc = networking.vpc;
  }
}
