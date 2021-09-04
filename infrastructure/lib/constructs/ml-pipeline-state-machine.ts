import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import { DeploymentConfig } from '../config/deployment-config';
import { CommonConfig } from '../config/sections/common';

export interface MlPipelineStateMachineProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly exporterTaskDefinition: ecs.TaskDefinition;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
}
  
export class MlPipelineStateMachine extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: MlPipelineStateMachineProps) {
    super(scope, id);
  
    const exportState = new tasks.EcsRunTask(this, 'export-step', {
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
      cluster: props.ecsCluster,
      taskDefinition: props.exporterTaskDefinition,
      launchTarget: new tasks.EcsFargateLaunchTarget(),
      securityGroups: [props.databaseClientSecurityGroup]
    });

    const definition = exportState;

    new sfn.StateMachine(this, 'state-machine', {
      stateMachineName: `${props.deployment.Prefix}-ml-pipeline`,
      definition,
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: props.commonConfig.XRayEnabled
    });
  }
}