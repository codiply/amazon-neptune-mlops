import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../config/deployment-config';
import { DataBrewRole } from '../constructs/roles/databrew-role';
import { GlueRole } from '../constructs/roles/glue-role';
import { NeptuneSagemakerRole } from '../constructs/roles/neptune-sagemaker-role';
import { SagemakerExecutionRole } from '../constructs/roles/sagemaker-execution-role';


export interface IamRolesProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
}

export interface IamRoles {
  readonly neptuneSagemakerRole: iam.Role;
  readonly sagemakerExecutionRole: iam.Role
}

export class IamRolesStack extends cdk.Stack {
  public readonly roles: IamRoles;

  constructor(scope: cdk.App, id: string, props: IamRolesProps) {
    super(scope, id, props);

    new GlueRole(this, 'glue-role', {
      deployment: props.deployment
    });

    new DataBrewRole(this, 'databrew-role', {
      deployment: props.deployment
    });

    const neptuneSagemakerRole = new NeptuneSagemakerRole(this, 'neptune-sagemaker-role', {
      deployment: props.deployment
    });

    const sagemakerExecutionRole = new SagemakerExecutionRole(this, 'sagemaker-execution-role', {
      deployment: props.deployment
    });

    this.roles = {
      neptuneSagemakerRole: neptuneSagemakerRole.role,
      sagemakerExecutionRole: sagemakerExecutionRole.role
    }
  }
}
