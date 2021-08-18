import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneNotebookPersistence } from '../constructs/neptune-notebook-persistence';
import { NeptuneNotebookConfig } from '../config/sections/neptune-notebook';

export interface StorageStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly neptuneNotebookConfig: NeptuneNotebookConfig;
  readonly vpc: ec2.Vpc;
}

export class StorageStack extends cdk.Stack {
  public readonly neptuneNotebookEfsClientSecurityGroup: ec2.SecurityGroup;
  public readonly neptuneNotebookEfsFileSystemId: string;

  constructor(scope: cdk.App, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const neptuneNotebookPersistence = new NeptuneNotebookPersistence(this, 'neptune-notebook-persistence', {
      deployment: props.deployment,
      vpc: props.vpc,
      encrypted: props.neptuneNotebookConfig.Encrypted,
      enableAutomaticBackups: props.neptuneNotebookConfig.EnableAutomaticBackups
    });

    this.neptuneNotebookEfsClientSecurityGroup = neptuneNotebookPersistence.efsClientSecurityGroup;
    this.neptuneNotebookEfsFileSystemId = neptuneNotebookPersistence.efsFileSystemId;
  }
}
