import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../config/deployment-config';
import { CommonConfig } from '../config/sections/common';
import { EcsTaskDefinition } from './ecs-task-definition';

export interface EcsServiceProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly serviceName: string;
  readonly memoryLimitMiB: number;
  readonly cpu: number;
  readonly policyStatements: iam.PolicyStatement[];
  readonly containerImageDirectory: string;
  readonly environment: { [key: string]: string; };
  readonly desiredCount: number;
  readonly securityGroups?: ec2.SecurityGroup[];
  readonly awsManagedPolicyNames?: string[];
}
  
export class EcsService extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: EcsServiceProps) {
    super(scope, id);

    const extraEnvironment = {
      "SERVICE_NAME": props.serviceName,
    };
    const mergedEnvironment = {...props.environment, ...extraEnvironment};

    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task', {
      ...props,
      taskName: props.serviceName
    });

    const service = new ecs.FargateService(this, 'ecs-service', {
      serviceName: props.serviceName,
      cluster: props.ecsCluster,
      taskDefinition: taskDefinition.taskDefinition,
      desiredCount: props.desiredCount,
      securityGroups: props.securityGroups, 
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: props.commonConfig.EcsCapacityProviderFargateWeight
        },
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: props.commonConfig.EcsCapacityProviderFargateSpotWeight
        }
      ]
    });
  }
}