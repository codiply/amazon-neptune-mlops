import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DeploymentConfig } from '../config/deployment-config';

export interface SagemakerVpcEndpointsProps {
  readonly deployment: DeploymentConfig;
  readonly vpc: ec2.Vpc;
}
  
export class SagemakerVpcEndpoints extends cdk.Construct {
  public readonly endpointClientSecurityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: SagemakerVpcEndpointsProps) {
    super(scope, id);

    const endpointClientSecurityGroup = new ec2.SecurityGroup(this, 'endpoints-client-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-sagemaker-vpc-endpoint-client`,
      description: `Security group for SageMaker VPC endpoints clients for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });
    this.endpointClientSecurityGroup = endpointClientSecurityGroup;

    const endpointSecurityGroup = new ec2.SecurityGroup(this, 'endpoints-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-sagemaker-vpc-endpoint`,
      description: `Security group for SageMaker VPC endpoints for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });
    endpointSecurityGroup.addIngressRule(
      endpointClientSecurityGroup, 
      ec2.Port.allTraffic(),
      'All traffic');

    new ec2.CfnVPCEndpoint(this, 'vpc-endpoint-sagemaker-runtime', {
      vpcId: props.vpc.vpcId,
      serviceName: `com.amazonaws.${cdk.Aws.REGION}.sagemaker.runtime`,
      vpcEndpointType: ec2.VpcEndpointType.INTERFACE,
      subnetIds: props.vpc.privateSubnets.map(x => x.subnetId),
      securityGroupIds: [endpointSecurityGroup.securityGroupId],
      privateDnsEnabled: true
    });

    new ec2.CfnVPCEndpoint(this, 'vpc-endpoint-sagemaker-api', {
      vpcId: props.vpc.vpcId,
      serviceName: `com.amazonaws.${cdk.Aws.REGION}.sagemaker.api`,
      vpcEndpointType: ec2.VpcEndpointType.INTERFACE,
      subnetIds: props.vpc.privateSubnets.map(x => x.subnetId),
      securityGroupIds: [endpointSecurityGroup.securityGroupId],
      privateDnsEnabled: true
    });
  }
}