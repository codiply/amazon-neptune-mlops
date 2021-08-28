import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ResourceArn } from '../../constants/resource-arn';
import { ServicePrincipals } from '../../constants/service-principals';

export interface SageMakerExecutionPolicyProps {
  readonly deployment: DeploymentConfig;
}
  
export class SageMakerExecutionPolicy extends cdk.Construct {
  public readonly policy: iam.Policy;
 
  constructor(scope: cdk.Construct, id: string, props: SageMakerExecutionPolicyProps) {
    super(scope, id);

    const policy = new iam.Policy(this, 'policy', {
      policyName: `${props.deployment.Prefix}-sagemaker-execution-policy`,
    });

    const policyStatements = [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:CreateNetworkInterfacePermission',
          'ec2:CreateVpcEndpoint',
          'ec2:DeleteNetworkInterface',
          'ec2:DeleteNetworkInterfacePermission',
          'ec2:DescribeDhcpOptions',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeRouteTables',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcEndpoints',
          'ec2:DescribeVpcs'
        ],
        resources: [
          '*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:BatchCheckLayerAvailability'
        ],
        resources: [
          '*',
          'arn:aws:ecr:*:*:repository/*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:PassRole'
        ],
        resources: [
          'arn:aws:iam::*:role/*'
        ],
        conditions: {
          'StringEquals': {
            'iam:PassedToService':[
              ServicePrincipals.SAGEMAKER
           ]
          }
        }
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:GenerateDataKey*'
        ],
        resources: [
          'arn:aws:kms:*:*:key/*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents'
        ],
        resources: [
          'arn:aws:logs:*:*:log-group:/aws/sagemaker/*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sagemaker:CreateHyperParameterTuningJob',
          'sagemaker:DescribeHyperParameterTuningJob',
          'sagemaker:ListTags',
          'sagemaker:CreateTransformJob',
          'sagemaker:DescribeTransformJob'
        ],
        resources: [
          'arn:aws:sagemaker:*:*:*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:AbortMultipartUpload",
          "s3:ListBucket"
        ],
        resources: [
          ResourceArn.bucket(props.deployment),
          `${ResourceArn.bucket(props.deployment)}/*`
        ]
      }),
    ];

    policy.addStatements(...policyStatements);

    this.policy = policy;
  }
}