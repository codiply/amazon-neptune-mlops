import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { ResourceArn } from '../../constants/resource-arn';

export interface ServiceIamRoleProps {
  readonly deployment: DeploymentConfig;
  readonly shortName: string;
  readonly fullName: string;
  readonly principalService: string;
  readonly policyStatements?: iam.PolicyStatement[];
  readonly awsManagedPolicyNames?: string[];
  readonly customerManagedPolicies?: iam.Policy[];
}
  
export class ServiceIamRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: ServiceIamRoleProps) {
    super(scope, id);

    const role = new iam.Role(this, 'role', {
      roleName: `${props.deployment.Prefix}-${props.shortName}-role`,
      description: `Role for ${props.fullName} for ${props.deployment.Project} in ${props.deployment.Environment}`,
      assumedBy: new iam.ServicePrincipal(props.principalService),
    });
 
    if (props.policyStatements) {
      props.policyStatements.forEach(statement => role.addToPolicy(statement));
    }

    if (props.awsManagedPolicyNames) {
      props.awsManagedPolicyNames.forEach(name => 
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(name)));
    }

    if (props.customerManagedPolicies) {
      props.customerManagedPolicies.forEach(policy =>
        policy.attachToRole(role));
    }

    this.role = role;
  }
}