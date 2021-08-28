import * as cdk from '@aws-cdk/core';
import { DeploymentConfig } from '../config/deployment-config';
import { DataBrewRole } from '../constructs/roles/databrew-role';
import { GlueRole } from '../constructs/roles/glue-role';
import { NeptuneSagemakerRole } from '../constructs/roles/neptune-sagemaker-role';
import { SagemakerExecutionRole } from '../constructs/roles/sagemaker-execution-role';


export interface IamRolesProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
}

export class IamRolesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: IamRolesProps) {
    super(scope, id, props);

    new GlueRole(this, 'glue-role', {
      deployment: props.deployment
    });

    new DataBrewRole(this, 'databrew-role', {
      deployment: props.deployment
    });

    new NeptuneSagemakerRole(this, 'neptune-sagemaker-role', {
      deployment: props.deployment
    });

    new SagemakerExecutionRole(this, 'sagemaker-execution-role', {
      deployment: props.deployment
    });
  }
}
