import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { ServiceIamRole } from './service-iam-role';
import { NeptuneSageMakerPolicy } from '../policies/neptune-sagemaker-policy';

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

    const serviceIamRole = new ServiceIamRole(this, 'service-iam-role', {
      deployment: props.deployment,
      shortName: 'neptune-sagameker',
      fullName: 'Neptune SageMaker',
      principalService: ServicePrincipals.RDS,
      customerManagedPolicies: [policy.policy]
    });

    this.role = serviceIamRole.role;
  }
}