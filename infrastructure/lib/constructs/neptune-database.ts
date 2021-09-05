import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneConfig } from '../config/sections/neptune';
import { Constants } from '../constants/constants';
import { ResourceArn } from '../constants/resource-arn';

export interface NeptuneDatabaseProps {
  readonly deployment: DeploymentConfig;
  readonly neptuneConfig: NeptuneConfig;
  readonly vpc: ec2.Vpc;
  readonly loaderRole: iam.Role;
  readonly neptuneSagemakerRole: iam.Role;
  readonly sagemakerExecutionRole: iam.Role;
  readonly sagemakerVpcEndpointClientSecurityGroup: ec2.SecurityGroup;
}
  
export class NeptuneDatabase extends cdk.Construct {
  public readonly cluster: neptune.DatabaseCluster;
  public readonly databaseClientSecurityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: NeptuneDatabaseProps) {
    super(scope, id);

    const databaseClientSecurityGroup = new ec2.SecurityGroup(this, 'database-client-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-database-client`,
      description: `Security group for database clients for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });
    this.databaseClientSecurityGroup = databaseClientSecurityGroup;

    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'database-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-database`,
      description: `Security group for database for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });
    databaseSecurityGroup.addIngressRule(
      databaseClientSecurityGroup, 
      ec2.Port.tcp(Constants.NEPTUNE_PORT),
      'Neptune database port');
    
    const subnetGroup = new neptune.SubnetGroup(this, 'database-subnet-group', {
      vpc: props.vpc,
      subnetGroupName: `${props.deployment.Prefix}-subnet-group`,
      description: `Subnet group for database for project ${props.deployment.Project} in ${props.deployment.Environment}`
    });

    const parameterGroup = new neptune.ParameterGroup(this, 'database-parameter-group', {
      parameterGroupName: `${props.deployment.Prefix}-parameter-group`,
      description: `Parameter group for database for project ${props.deployment.Project} in ${props.deployment.Environment}`,
      parameters: {

      }
    });

    const clusterParameterGroup = new neptune.ClusterParameterGroup(this, 'database-cluster-parameter-group', {
      clusterParameterGroupName: `${props.deployment.Prefix}-cluster-parameter-group`,
      description: `Parameter group for database cluster for project ${props.deployment.Project} in ${props.deployment.Environment}`,
      parameters: {
        neptune_ml_iam_role: props.neptuneSagemakerRole.roleArn
      }
    });

    const cluster = new neptune.DatabaseCluster(this, 'neptune-database-cluster', {
      dbClusterName: `${props.deployment.Prefix}-db-cluster`,
      vpc: props.vpc,
      instanceType: neptune.InstanceType.of(props.neptuneConfig.InstanceType),
      securityGroups: [databaseSecurityGroup, props.sagemakerVpcEndpointClientSecurityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      clusterParameterGroup: clusterParameterGroup,
      associatedRoles: [props.loaderRole, props.neptuneSagemakerRole],
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    this.cluster = cluster;
  }
}