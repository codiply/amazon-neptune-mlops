import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneNotebook } from '../constructs/neptune-notebook';
import { NeptuneNotebookConfig } from '../config/sections/neptune-notebook';

export interface NeptuneNotebookStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly neptuneNotebookConfig: NeptuneNotebookConfig;
  readonly vpc: ec2.Vpc;
  readonly neptuneCluster: neptune.DatabaseCluster;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
  readonly efsClientSecurityGroup: ec2.SecurityGroup;
  readonly efsFileSystemId: string;
}

export class NeptuneNotebookStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: NeptuneNotebookStackProps) {
    super(scope, id, props);

    new NeptuneNotebook(this, 'neptune-notebook', {
      deployment: props.deployment,
      neptuneNotebookConfig: props.neptuneNotebookConfig,
      vpc: props.vpc,
      neptuneCluster: props.neptuneCluster,
      databaseClientSecurityGroup: props.databaseClientSecurityGroup,
      efsClientSecurityGroup: props.efsClientSecurityGroup,
      efsFileSystemId: props.efsFileSystemId
    });
  }
}
