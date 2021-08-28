import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { NeptuneSageMakerPolicy } from '../policies/neptune-sagemaker-policy';
import { ResourceNames } from '../../constants/resource-names';

export interface NeptuneSagemakerRoleProps {
  readonly deployment: DeploymentConfig;
}
  
export class NeptuneSagemakerRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: NeptuneSagemakerRoleProps) {
    super(scope, id);

    const policy = new NeptuneSageMakerPolicy(this, 'policy', {
      deployment: props.deployment
    });

    const role = new iam.Role(this, 'role', {
      roleName: ResourceNames.neptuneSagemakerRole(props.deployment),
      description: `Role that Neptune ML uses for access to the resources it needs for ${props.deployment.Project} in ${props.deployment.Environment}`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.RDS),
    });

    policy.policy.attachToRole(role);

    this.role = role;
  }
}