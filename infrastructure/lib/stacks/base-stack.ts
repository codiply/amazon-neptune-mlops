import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneNotebookPersistence } from '../constructs/neptune-notebook-persistence';
import { Networking } from '../constructs/networking';
import { VpcConfig } from '../config/sections/vpc';
import { NeptuneNotebookEfsConfig } from '../config/sections/neptune-notebook-efs';

export interface BaseStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly vpcConfig: VpcConfig;
  readonly neptuneNotebookEfsConfig: NeptuneNotebookEfsConfig;
}

export class BaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly neptuneNotebookEfsClientSecurityGroup: ec2.SecurityGroup;
  public readonly neptuneNotebookEfsFileSystemId: string;

  constructor(scope: cdk.App, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const networking = new Networking(this, 'networking', {
      deployment: props.deployment,
      vpcConfig: props.vpcConfig
    });
    this.vpc = networking.vpc;

    const neptuneNotebookPersistence = new NeptuneNotebookPersistence(this, 'neptune-notebook-persistence', {
      deployment: props.deployment,
      vpc: this.vpc,
      encrypted: props.neptuneNotebookEfsConfig.Encrypted,
      enableAutomaticBackups: props.neptuneNotebookEfsConfig.EnableAutomaticBackups
    });

    this.neptuneNotebookEfsClientSecurityGroup = neptuneNotebookPersistence.efsClientSecurityGroup;
    this.neptuneNotebookEfsFileSystemId = neptuneNotebookPersistence.efsFileSystemId;
  }
}
