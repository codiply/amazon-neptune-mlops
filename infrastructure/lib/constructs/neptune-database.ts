import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneConfig } from '../config/sections/neptune';

export interface NeptuneDatabaseProps {
  readonly deployment: DeploymentConfig;
  readonly config: NeptuneConfig;
  readonly vpc: ec2.Vpc;
}
  
export class NeptuneDatabase extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: NeptuneDatabaseProps) {
    super(scope, id);

    const cluster = new neptune.DatabaseCluster(this, 'neptune-database-cluster', {
      dbClusterName: `${props.deployment.Prefix}-db-cluster`,
      vpc: props.vpc,
      instanceType: neptune.InstanceType.of(props.config.InstanceType),
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}