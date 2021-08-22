import * as cdk from '@aws-cdk/core';
import { DeploymentConfig } from '../config/deployment-config';
import { DataBrewRole } from '../constructs/roles/databrew-role';


export interface IamRolesProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
}

export class IamRolesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: IamRolesProps) {
    super(scope, id, props);

    new DataBrewRole(this, 'databrew-role', {
      deployment: props.deployment
    });
  }
}
