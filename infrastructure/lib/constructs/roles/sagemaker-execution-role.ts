import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ServicePrincipals } from '../../constants/service-principals';
import { SageMakerExecutionPolicy } from '../policies/sagemaker-execution-policy';
import { ResourceNames } from '../../constants/resource-names';
import { NeptuneSageMakerPolicy } from '../policies/neptune-sagemaker-policy';

export interface SagemakerExecutionRoleProps {
  readonly deployment: DeploymentConfig;
}
  
export class SagemakerExecutionRole extends cdk.Construct {
  public readonly role: iam.Role;
 
  constructor(scope: cdk.Construct, id: string, props: SagemakerExecutionRoleProps) {
    super(scope, id);

    const sagemakerExecutionPolicy = new SageMakerExecutionPolicy(this, 'sagemaker-execution-policy', {
      deployment: props.deployment
    });
    const neptuneSagemakerPolicy = new NeptuneSageMakerPolicy(this, 'neptune-sagemaker-plicy', {
      deployment: props.deployment
    })

    const role = new iam.Role(this, 'role', {
      roleName: ResourceNames.sagemakerExecutionRole(props.deployment),
      description: `Role that SageMaker uses for access to the resources it needs to work with Neptune ML for ${props.deployment.Project} in ${props.deployment.Environment}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(ServicePrincipals.RDS),
        new iam.ServicePrincipal(ServicePrincipals.SAGEMAKER)
      )
    });

    sagemakerExecutionPolicy.policy.attachToRole(role);
    neptuneSagemakerPolicy.policy.attachToRole(role);

    this.role = role;
  }
}