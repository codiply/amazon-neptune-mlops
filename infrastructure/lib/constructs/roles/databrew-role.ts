import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../..//config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { ResourceArn } from '../../constants/resource-arn';
import { ServiceIamRole } from './service-iam-role';

export interface DataBrewRoleProps {
  readonly deployment: DeploymentConfig;
}
  
export class DataBrewRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: DataBrewRoleProps) {
    super(scope, id);

    const policyStatements = [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:*'
        ],
        resources: [
          ResourceArn.bucket(props.deployment),
          `${ResourceArn.bucket(props.deployment)}/*`
        ]
      })
    ];

    const serviceIamRole = new ServiceIamRole(this, 'service-iam-role', {
      deployment: props.deployment,
      shortName: 'databrew',
      fullName: 'AWS Glue DataBrew',
      principalService: ServicePrincipals.DATABREW,
      policyStatements: policyStatements
    });

    this.role = serviceIamRole.role;
  }
}