import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../..//config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { ResourceArn } from '../../constants/resource-arn';

export interface DataBrewRoleProps {
  readonly deployment: DeploymentConfig;
}
  
export class DataBrewRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: DataBrewRoleProps) {
    super(scope, id);

    const role = new iam.Role(this, 'role', {
      roleName: `${props.deployment.Prefix}-databrew-role`,
      description: `Role for DataBrew for ${props.deployment.Project} in ${props.deployment.Environment}`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.DATABREW),
      managedPolicies: [
      ]
    });

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*'
      ],
      resources: [
        ResourceArn.bucket(props.deployment),
        `${ResourceArn.bucket(props.deployment)}/*`
      ]
    }));
  }
}