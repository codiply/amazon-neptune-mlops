import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { DeploymentConfig } from '../../config/deployment-config';
import { ResourceArn } from '../../constants/resource-arn';
import { ServicePrincipals } from '../../constants/service-principals';

export interface NeptuneSageMakerPolicyProps {
  readonly deployment: DeploymentConfig;
}
  
export class NeptuneSageMakerPolicy extends cdk.Construct {
  public readonly policy: iam.Policy;
 
  constructor(scope: cdk.Construct, id: string, props: NeptuneSageMakerPolicyProps) {
    super(scope, id);

    const policy = new iam.Policy(this, 'policy', {
      policyName: `${props.deployment.Prefix}-neptune-sagemaker-policy`,
    });

    const policyStatements = [
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
          'sagemaker:CreateEndpoint',
          'sagemaker:CreateEndpointConfig',
          'sagemaker:CreateHyperParameterTuningJob',
          'sagemaker:CreateModel',
          'sagemaker:CreateProcessingJob',
          'sagemaker:CreateTrainingJob',
          'sagemaker:CreateTransformJob',
          'sagemaker:DeleteEndpoint',
          'sagemaker:DeleteEndpointConfig',
          'sagemaker:StopHyperParameterTuningJob',
          'sagemaker:DeleteModel',
          'sagemaker:StopProcessingJob',
          'sagemaker:StopTrainingJob',
          'sagemaker:StopTransformJob',
          'sagemaker:DescribeEndpoint',
          'sagemaker:DescribeEndpointConfig',
          'sagemaker:DescribeHyperParameterTuningJob',
          'sagemaker:DescribeModel',
          'sagemaker:DescribeProcessingJob',
          'sagemaker:DescribeTrainingJob',
          'sagemaker:DescribeTransformJob',
          'sagemaker:InvokeEndpoint',
          'sagemaker:ListTags',
          'sagemaker:ListTrainingJobsForHyperParameterTuningJob',
          'sagemaker:UpdateEndpoint'
        ],
        resources: [
          'arn:aws:sagemaker:*:*:*'
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sagemaker:ListEndpointConfigs',
          'sagemaker:ListEndpoints',
          'sagemaker:ListHyperParameterTuningJobs',
          'sagemaker:ListModels',
          'sagemaker:ListProcessingJobs',
          'sagemaker:ListTrainingJobs',
          'sagemaker:ListTransformJobs'
        ],
        resources: [
          '*'
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