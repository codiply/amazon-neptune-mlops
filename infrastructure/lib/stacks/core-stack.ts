import * as cdk from '@aws-cdk/core';
import { Networking } from '../constructs/networking';
import { Config } from '../config/config';
import { NeptuneDatabase } from '../constructs/neptune-database';

export interface CoreStackProps extends cdk.StackProps {
  readonly config: Config;
}

export class CoreStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: CoreStackProps) {
    super(scope, id, props);

    const networking = new Networking(this, 'networking', {
      deployment: props.config.Deployment,
      config: props.config.Vpc
    });

    const neptune = new NeptuneDatabase(this, 'neptune-database', {
      deployment: props.config.Deployment,
      config: props.config.Neptune,
      vpc: networking.vpc
    });
  }
}
