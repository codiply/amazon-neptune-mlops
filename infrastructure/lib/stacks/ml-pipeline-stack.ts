import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneExporterEcsTaskDefinition } from '../constructs/neptune-exporter-ecs-task';
import { NeptuneExporterConfig } from '../config/sections/neptune-export-task';
import { CommonConfig } from '../config/sections/common';
import { MlPipelineStateMachine } from '../constructs/ml-pipeline-state-machine';

export interface MlPipelineStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly neptuneExporterConfig: NeptuneExporterConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly databaseClusterEndpoint: neptune.Endpoint;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
}

export class MlPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: MlPipelineStackProps) {
    super(scope, id, props);
  
    const exporterTaskDefinition = new NeptuneExporterEcsTaskDefinition(this, 'exporter-ecs-task-definition', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      ecsCluster: props.ecsCluster,
      neptuneExporterConfig: props.neptuneExporterConfig,
      databaseClusterEndpoint: props.databaseClusterEndpoint,
      databaseClientSecurityGroup: props.databaseClientSecurityGroup
    });

    new MlPipelineStateMachine(this, 'state-machine', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      ecsCluster: props.ecsCluster,
      exporterTaskDefinition: exporterTaskDefinition.taskDefinition,
      databaseClientSecurityGroup: props.databaseClientSecurityGroup
    });
  }
}
