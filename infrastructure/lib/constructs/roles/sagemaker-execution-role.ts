import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { ServiceIamRole } from './service-iam-role';
import { SageMakerExecutionPolicy } from '../policies/sagemaker-execution-policy';

export interface SagemakerExecutionRoleProps {
  readonly deployment: DeploymentConfig;
}
  
export class SagemakerExecutionRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: SagemakerExecutionRoleProps) {
    super(scope, id);

    const policy = new SageMakerExecutionPolicy(this, 'policy', {
      deployment: props.deployment
    });

    const serviceIamRole = new ServiceIamRole(this, 'service-iam-role', {
      deployment: props.deployment,
      shortName: 'sagemaker-execution',
      fullName: 'SageMaker Execution',
      principalService: ServicePrincipals.SAGEMAKER,
      customerManagedPolicies: [policy.policy]
    });

    this.role = serviceIamRole.role;
  }
}