import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneExporterEcsTaskDefinition } from '../constructs/neptune-exporter-ecs-task';
import { NeptuneExporterConfig } from '../config/sections/neptune-export-task';
import { CommonConfig } from '../config/sections/common';

export interface MlPipelineStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly neptuneExporterConfig: NeptuneExporterConfig;
  readonly ecsCluster: ecs.Cluster;
}

export class MlPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: MlPipelineStackProps) {
    super(scope, id, props);
  
    new NeptuneExporterEcsTaskDefinition(this, 'exporter-ecs-task-definition', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      ecsCluster: props.ecsCluster,
      neptuneExporterConfig: props.neptuneExporterConfig
    });
  }
}
