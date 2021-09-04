import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { EcsTaskDefinition } from './ecs-task-definition';
import { CommonConfig } from '../config/sections/common';
import { NeptuneExporterConfig } from '../config/sections/neptune-export-task';
import { S3Paths } from '../constants/s3-paths';
import { ResourceNames } from '../constants/resource-names';
import { ResourceArn } from '../constants/resource-arn';

export interface NeptuneExporterEcsTaskDefinitionProps {
  readonly deployment: DeploymentConfig
  readonly commonConfig: CommonConfig;
  readonly neptuneExporterConfig: NeptuneExporterConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly databaseClusterEndpoint: neptune.Endpoint;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
}
  
export class NeptuneExporterEcsTaskDefinition extends cdk.Construct {
  private props: NeptuneExporterEcsTaskDefinitionProps;

  constructor(scope: cdk.Construct, id: string, props: NeptuneExporterEcsTaskDefinitionProps) {
    super(scope, id);

    this.props = props;

    const environment = {
      SERVICE_REGION: props.deployment.AWSRegion,
      DATABASE_ENDPOINT_HOST: props.databaseClusterEndpoint.hostname,
      OUTPUT_S3_PATH: `s3://${ResourceNames.bucketName(props.deployment)}/${S3Paths.NEPTUNE_EXPORT}`
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
      desiredCount: 1
    });
  }

  private definePolicyStatements(): iam.PolicyStatement[] {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectTagging',
          's3:GetObject'
        ],
        resources: [
          `${ResourceArn.bucket(this.props.deployment)}/${S3Paths.NEPTUNE_EXPORT}/*`
        ]
      })
    ];
  }
}