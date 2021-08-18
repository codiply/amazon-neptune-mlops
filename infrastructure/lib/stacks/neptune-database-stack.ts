import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneConfig } from '../config/sections/neptune';
import { NeptuneDatabase } from '../constructs/neptune-database';

export interface NeptuneDatabaseStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly neptuneConfig: NeptuneConfig;
  readonly vpc: ec2.Vpc;
}

export class NeptuneDatabaseStack extends cdk.Stack {
  public readonly cluster: neptune.DatabaseCluster;
  public readonly databaseClientSecurityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.App, id: string, props: NeptuneDatabaseStackProps) {
    super(scope, id, props);

    const neptuneDatabase = new NeptuneDatabase(this, 'neptune-database', {
      deployment: props.deployment,
      config: props.neptuneConfig,
      vpc: props.vpc
    });

    this.cluster = neptuneDatabase.cluster;
    this.databaseClientSecurityGroup = neptuneDatabase.databaseClientSecurityGroup;
  }
}
