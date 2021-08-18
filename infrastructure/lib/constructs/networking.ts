import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { VpcConfig } from '../config/sections/vpc';
import { DeploymentConfig } from '../config/deployment-config';

export interface NetworkingProps {
  readonly deployment: DeploymentConfig;
  readonly vpcConfig: VpcConfig;
}
  
export class Networking extends cdk.Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const natGatewayProvider = props.vpcConfig.UseNatInstances ? 
      ec2.NatInstanceProvider.instance({instanceType: new ec2.InstanceType('t3.micro')}) :
      ec2.NatProvider.gateway()
      
    const vpc = new ec2.Vpc(this, `${props.deployment.Prefix}-vpc`, {
      cidr: props.vpcConfig.CidrRange,
      maxAzs: props.vpcConfig.MaxAZs,
      natGateways: props.vpcConfig.NatGateways,
      natGatewayProvider: natGatewayProvider,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 22,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE
        },
      ]
    });
    cdk.Tags.of(vpc).add('Name', `${props.deployment.Prefix}-vpc`);

    this.vpc = vpc;
  }
}