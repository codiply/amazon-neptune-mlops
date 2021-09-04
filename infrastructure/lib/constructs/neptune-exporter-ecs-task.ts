import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../config/deployment-config';
import { EcsTaskDefinition } from './ecs-task-definition';
import { CommonConfig } from '../config/sections/common';
import { NeptuneExporterConfig } from '../config/sections/neptune-export-task';

export interface NeptuneExporterEcsTaskDefinitionProps {
  readonly deployment: DeploymentConfig
  readonly commonConfig: CommonConfig;
  readonly neptuneExporterConfig: NeptuneExporterConfig;
  readonly ecsCluster: ecs.Cluster;
}
  
export class NeptuneExporterEcsTaskDefinition extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: NeptuneExporterEcsTaskDefinitionProps) {
    super(scope, id);

    const environment = {

    };

    new EcsTaskDefinition(this, 'task-definition', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      ecsCluster: props.ecsCluster,
      taskName: 'neptune-export',
      memoryLimitMiB: props.neptuneExporterConfig.MemoryLimitMiB,
      cpu: props.neptuneExporterConfig.Cpu,
      policyStatements: this.definePolicyStatements(),
      containerImageDirectory: './assets/containers/neptune-exporter/',
      environment: environment,
      desiredCount: 1,
      securityGroups: []
    })
  }

  private definePolicyStatements(): iam.PolicyStatement[] {
    return [];
  }
}