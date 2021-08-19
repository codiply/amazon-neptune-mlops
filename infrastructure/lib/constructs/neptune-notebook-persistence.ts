import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import { DeploymentConfig } from '../config/deployment-config';
import { Constants } from '../constants/constants';

export interface NeptuneNotebookPersistenceProps {
  readonly deployment: DeploymentConfig;
  readonly vpc: ec2.Vpc;
  readonly encrypted: boolean;
  readonly enableAutomaticBackups: boolean;
}
  
export class NeptuneNotebookPersistence extends cdk.Construct {
  private readonly props: NeptuneNotebookPersistenceProps;

  public efsClientSecurityGroup: ec2.SecurityGroup;
  public efsFileSystemId: string;

  constructor(scope: cdk.Construct, id: string, props: NeptuneNotebookPersistenceProps) {
    super(scope, id);

    this.props = props;

    const efsClientSecurityGroup = new ec2.SecurityGroup(this, 'efs-client-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-neptune-notebook-efs-client`,
      description: `Security group for Neptune Notebook EFS clients for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'efs-sg', {
      vpc: props.vpc,
      securityGroupName: `${props.deployment.Prefix}-neptune-notebook-efs`,
      description: `Security group for Neptune Notebook EFS for project ${props.deployment.Project} in ${props.deployment.Environment}`,
    });
    efsSecurityGroup.addIngressRule(
      efsClientSecurityGroup, 
      ec2.Port.tcp(Constants.EFS_PORT),
      'EFS port');

    const fileSystem = new efs.FileSystem(this, 'file-system', {
      fileSystemName: `${props.deployment.Prefix}-neptune-notebook-efs`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE
      }),
      securityGroup: efsSecurityGroup,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      encrypted: props.encrypted,
      enableAutomaticBackups: props.enableAutomaticBackups,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    this.efsClientSecurityGroup = efsClientSecurityGroup;
    this.efsFileSystemId = fileSystem.fileSystemId
  }
}