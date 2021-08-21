import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as neptune from '@aws-cdk/aws-neptune';
import * as sagemaker from '@aws-cdk/aws-sagemaker';
import { DeploymentConfig } from '../config/deployment-config';
import { Constants } from '../constants/constants';
import { ServicePrincipals } from '../constants/service-principals';
import { NeptuneNotebookConfig } from '../config/sections/neptune-notebook';

export interface NeptuneNotebookProps {
  readonly deployment: DeploymentConfig;
  readonly neptuneNotebookConfig: NeptuneNotebookConfig;
  readonly vpc: ec2.Vpc;
  readonly neptuneCluster: neptune.DatabaseCluster;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
  readonly efsClientSecurityGroup: ec2.SecurityGroup;
  readonly efsFileSystemId: string;
}
  
export class NeptuneNotebook extends cdk.Construct {
  private readonly props: NeptuneNotebookProps;

  constructor(scope: cdk.Construct, id: string, props: NeptuneNotebookProps) {
    super(scope, id);

    this.props = props;

    const notebookRole = this.defineNotebookRole();

    const lifecycleConfigName = `${this.props.deployment.Prefix}-notebook-instance-lifecycle-config`;
    const lifecycleConfig = this.defineNotebookInstanceLifecycleConfig(lifecycleConfigName);
    
    this.defineNotebookInstance(notebookRole, lifecycleConfigName);
  }

  private defineNotebookRole(): iam.Role {
    const role = new iam.Role(this, 'notebook-role', {
      roleName: `${this.props.deployment.Prefix}-neptune-notebook-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.SAGEMAKER)
    });
    
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket'
      ],
      resources: [
        'arn:aws:s3:::aws-neptune-notebook',
        'arn:aws:s3:::aws-neptune-notebook/*'
      ]
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['neptune-db:connect'],
      resources: [`arn:aws:neptune-db:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:${this.props.neptuneCluster.clusterResourceIdentifier}/*`]
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogDelivery',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DeleteLogDelivery',
        'logs:Describe*',
        'logs:GetLogDelivery',
        'logs:GetLogEvents',
        'logs:ListLogDeliveries',
        'logs:PutLogEvents',
        'logs:PutResourcePolicy',
        'logs:UpdateLogDelivery'
      ],
      resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/sagemaker/NotebookInstances:*`]
    }));

    return role;
  }

  private defineNotebookInstanceLifecycleConfig(name: string): sagemaker.CfnNotebookInstanceLifecycleConfig {
    const persistentPath = `/home/ec2-user/SageMaker/${this.props.neptuneNotebookConfig.PersistentDirectory}`;
    const efsDns = `${this.props.efsFileSystemId}.efs.${cdk.Aws.REGION}.amazonaws.com`
    const lifecycleConfig = new sagemaker.CfnNotebookInstanceLifecycleConfig(this, 'notebook-instance-lifecycle-config', {
      notebookInstanceLifecycleConfigName: `${this.props.deployment.Prefix}-notebook-instance-lifecycle-config`,
      onCreate: [{
        content: cdk.Fn.base64(
`#!/bin/bash
set -e
mkdir ${persistentPath}`)
      }],
      onStart: [{
        content: cdk.Fn.base64(
`#!/bin/bash
set -e
sudo -u ec2-user -i <<'EOF'
echo "export GRAPH_NOTEBOOK_AUTH_MODE=DEFAULT" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_HOST=${this.props.neptuneCluster.clusterEndpoint.hostname}" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_PORT=${Constants.NEPTUNE_PORT}" >> ~/.bashrc
echo "export NEPTUNE_LOAD_FROM_S3_ROLE_ARN=''" >> ~/.bashrc
echo "export AWS_REGION=${cdk.Aws.REGION}" >> ~/.bashrc
aws s3 cp s3://aws-neptune-notebook/graph_notebook.tar.gz /tmp/graph_notebook.tar.gz
rm -rf /tmp/graph_notebook
tar -zxvf /tmp/graph_notebook.tar.gz -C /tmp
/tmp/graph_notebook/install.sh
EOF
mount -t nfs -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=120,retrans=2 ${efsDns}:/ ${persistentPath}
chmod go+rw ${persistentPath}`)
      }]
    });
    return lifecycleConfig
  }

  private defineNotebookInstance(
    role: iam.Role, 
    lifecycleConfigName: string): sagemaker.CfnNotebookInstance {
      const notebookInstance = new sagemaker.CfnNotebookInstance(this, 'notebook-instance', {
        // Name has to start with 'aws-neptune-'
        notebookInstanceName: `aws-neptune-${this.props.deployment.Prefix}-neptune-notebook-instance`,
        instanceType: this.props.neptuneNotebookConfig.InstanceType,
        roleArn: role.roleArn,
        lifecycleConfigName: lifecycleConfigName,
        rootAccess: 'Enabled',
        subnetId: this.props.vpc.privateSubnets[0].subnetId,
        securityGroupIds:[
          this.props.databaseClientSecurityGroup.securityGroupId,
          this.props.efsClientSecurityGroup.securityGroupId
        ],
        tags: [
          new cdk.Tag('aws-neptune-cluster-id', this.props.neptuneCluster.clusterIdentifier),
          new cdk.Tag('aws-neptune-resource-id', this.props.neptuneCluster.clusterResourceIdentifier)
        ]
      });
      return notebookInstance;
  }
}