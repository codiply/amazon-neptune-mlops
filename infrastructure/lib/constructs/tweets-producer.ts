import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as kms from '@aws-cdk/aws-kms';
import { DeploymentConfig } from '../config/deployment-config';
import { TwitterApiConfig } from '../config/sections/twitter-api';
import { TweetsProducerConfig } from '../config/sections/tweets-producer';
import { EcsService } from './ecs-service';
import { CommonConfig } from '../config/sections/common';

export interface TweetsProducerProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly tweetsProducerConfig: TweetsProducerConfig;
  readonly twitterApiConfig: TwitterApiConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly deliveryStream: firehose.DeliveryStream;
}
  
export class TweetsProducer extends cdk.Construct {
  private readonly props: TweetsProducerProps;

  constructor(scope: cdk.Construct, id: string, props: TweetsProducerProps) {
    super(scope, id);

    this.props = props;

    const policyStatements = this.defineTaskRolePolicyStatements();

    const environment = {
      TWITTER_API_CONSUMER_KEY_SSM_PARAMETER: this.props.twitterApiConfig.ConsumerKeySsmParameter,
      TWITTER_API_CONSUMER_SECRET_SSM_PARAMETER: this.props.twitterApiConfig.ConsumerSecretSsmParameter,
      TWITTER_API_ACCESS_TOKEN_SSM_PARAMETER: this.props.twitterApiConfig.AccessTokenSsmParameter,
      TWITTER_API_ACCESS_TOKEN_SECRET_SSM_PARAMETER: this.props.twitterApiConfig.AccessTokenSecretSsmParameter,
      TWEETS_FILTER: this.props.tweetsProducerConfig.Filter,
      DELIVERY_STREAM_NAME: this.props.deliveryStream.deliveryStreamName
    };

    new EcsService(this, 'tweets-producer-ecs-service', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      ecsCluster: props.ecsCluster,
      serviceName: 'tweets-producer',
      memoryLimitMiB: props.tweetsProducerConfig.MemoryLimitMiB,
      cpu: props.tweetsProducerConfig.Cpu,
      policyStatements: policyStatements,
      containerImageDirectory: './assets/containers/tweets-producer/',
      environment: environment,
      desiredCount: 1,
    });
  }

  private defineTaskRolePolicyStatements(): iam.PolicyStatement[] {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter*'
        ],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${this.props.twitterApiConfig.ConsumerKeySsmParameter}`,
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${this.props.twitterApiConfig.ConsumerSecretSsmParameter}`,
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${this.props.twitterApiConfig.AccessTokenSsmParameter}`,
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${this.props.twitterApiConfig.AccessTokenSecretSsmParameter}`
        ]}),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:Decrypt'
        ],
        resources: [
          kms.Alias.fromAliasName(this, 'kms-key', 'alias/aws/ssm').keyArn
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'firehose:PutRecord'
        ],
        resources: [
          this.props.deliveryStream.deliveryStreamArn
        ]
      })
    ];
  }
}