import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as kms from '@aws-cdk/aws-kms';
import { DeploymentConfig } from '../config/deployment-config';
import { TwitterApiConfig } from '../config/sections/twitter-api';
import { TweetProducerConfig } from '../config/sections/tweet-producer';
import { EcsService } from './ecs-service';

export interface TweetProducerProps {
  readonly deployment: DeploymentConfig;
  readonly tweetProducerConfig: TweetProducerConfig;
  readonly twitterApiConfig: TwitterApiConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly deliveryStream: firehose.DeliveryStream;
}
  
export class TweetProducer extends cdk.Construct {
  private readonly props: TweetProducerProps;

  constructor(scope: cdk.Construct, id: string, props: TweetProducerProps) {
    super(scope, id);

    this.props = props;

    const policyStatements = this.defineTaskRolePolicyStatements();

    const environment = {
      TWITTER_API_CONSUMER_KEY_SSM_PARAMETER: this.props.twitterApiConfig.ConsumerKeySsmParameter,
      TWITTER_API_CONSUMER_SECRET_SSM_PARAMETER: this.props.twitterApiConfig.ConsumerSecretSsmParameter,
      TWITTER_API_ACCESS_TOKEN_SSM_PARAMETER: this.props.twitterApiConfig.AccessTokenSsmParameter,
      TWITTER_API_ACCESS_TOKEN_SECRET_SSM_PARAMETER: this.props.twitterApiConfig.AccessTokenSecretSsmParameter,
      TWEET_FILTER: this.props.tweetProducerConfig.Filter,
      DELIVER_STREAM_NAME: this.props.deliveryStream.deliveryStreamName
    };

    new EcsService(this, 'tweet-producer-ecs-service', {
      deployment: props.deployment,
      ecsCluster: props.ecsCluster,
      serviceName: 'tweet-producer',
      memoryLimitMiB: props.tweetProducerConfig.MemoryLimitMiB,
      cpu: props.tweetProducerConfig.Cpu,
      policyStatements: policyStatements,
      containerImageDirectory: './assets/containers/tweet-producer/',
      environment: environment,
      desiredCount: 1,
      enableXray: true
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