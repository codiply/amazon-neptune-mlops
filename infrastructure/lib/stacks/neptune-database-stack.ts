import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneConfig } from '../config/sections/neptune';
import { NeptuneDatabase } from '../constructs/neptune-database';

export interface NeptuneDatabaseStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly neptune: NeptuneConfig;
  readonly vpc: ec2.Vpc;
}

export class NeptuneDatabaseStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: NeptuneDatabaseStackProps) {
    super(scope, id, props);

    const neptune = new NeptuneDatabase(this, 'neptune-database', {
      deployment: props.deployment,
      config: props.neptune,
      vpc: props.vpc
    });
  }
}
