import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneNotebookPersistence } from '../constructs/neptune-notebook-persistence';
import { Networking } from '../constructs/networking';
import { VpcConfig } from '../config/sections/vpc';
import { NeptuneNotebookEfsConfig } from '../config/sections/neptune-notebook-efs';
import { EcsClusterConfig } from '../config/sections/ecs-cluster';
import { ResourceNames } from '../constants/resource-names';
import { SagemakerVpcEndpoints } from '../constructs/sagemaker-vpc-endpoints';

export interface BaseStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly vpcConfig: VpcConfig;
  readonly neptuneNotebookEfsConfig: NeptuneNotebookEfsConfig;
  readonly ecsClusterConfig: EcsClusterConfig;
}

export class BaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly sagemakerVpcEndpointClientSecurityGroup: ec2.SecurityGroup;
  public readonly neptuneNotebookEfsClientSecurityGroup: ec2.SecurityGroup;
  public readonly neptuneNotebookEfsFileSystemId: string;
  public readonly ecsCluster: ecs.Cluster;
  public readonly s3Bucket: s3.Bucket;

  constructor(scope: cdk.App, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const networking = new Networking(this, 'networking', {
      deployment: props.deployment,
      vpcConfig: props.vpcConfig
    });
    this.vpc = networking.vpc;

    const sagemakerVpcEndpoints = new SagemakerVpcEndpoints(this, 'sagemaker-vpc-endpoints', {
      deployment: props.deployment,
      vpc: networking.vpc
    });
    this.sagemakerVpcEndpointClientSecurityGroup = sagemakerVpcEndpoints.endpointClientSecurityGroup;

    const neptuneNotebookPersistence = new NeptuneNotebookPersistence(this, 'neptune-notebook-persistence', {
      deployment: props.deployment,
      vpc: this.vpc,
      encrypted: props.neptuneNotebookEfsConfig.Encrypted,
      enableAutomaticBackups: props.neptuneNotebookEfsConfig.EnableAutomaticBackups
    });
    this.neptuneNotebookEfsClientSecurityGroup = neptuneNotebookPersistence.efsClientSecurityGroup;
    this.neptuneNotebookEfsFileSystemId = neptuneNotebookPersistence.efsFileSystemId;

    const ecsCluster = new ecs.Cluster(this, 'ecs-cluster', {
      clusterName: `${props.deployment.Prefix}-cluster`,
      vpc: networking.vpc,
      enableFargateCapacityProviders: true,
      containerInsights: props.ecsClusterConfig.ContainerInsightsEnabled
    });
    this.ecsCluster = ecsCluster;

    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      bucketName: ResourceNames.bucketName(props.deployment),
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    this.s3Bucket = s3Bucket;
  }
}
