import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as neptune from '@aws-cdk/aws-neptune';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import { DeploymentConfig } from '../config/deployment-config';
import { EcsService } from './ecs-service';
import { GremlinCsvLoaderConfig } from '../config/sections/gremlin-csv-loader';
import { CommonConfig } from '../config/sections/common';
import { Constants } from '../constants/constants';

export interface GremlinCsvLoaderProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly gremlinCsvLoaderConfig: GremlinCsvLoaderConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly s3Bucket: s3.Bucket;
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
  readonly databaseClusterEndpoint: neptune.Endpoint;
  readonly loaderRole: iam.Role;
}
  
export class GremlinCsvLoader extends cdk.Construct {
  private props: GremlinCsvLoaderProps;

  public queue: sqs.Queue;

  constructor(scope: cdk.Construct, id: string, props: GremlinCsvLoaderProps) {
    super(scope, id);

    this.props = props;

    const deadLetterQueue = new sqs.Queue(this, 'dead-letter-queue', {
      queueName: `${props.deployment.Prefix}-gremlin-csv-loader-dlq`,
    });

    const queue = new sqs.Queue(this, 'queue', {
      queueName: `${props.deployment.Prefix}-gremlin-csv-loader`,
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3
      }
    });
    this.queue = queue;

    const policyStatements = this.defineTaskRolePolicyStatements();

    const environment = {
      SQS_QUEUE_URL: queue.queueUrl,
      DATABASE_ENDPOINT_HOST: props.databaseClusterEndpoint.hostname,
      DATABASE_ENDPOINT_PORT: Constants.NEPTUNE_PORT.toString(),
      LOADER_ROLE_ARN: props.loaderRole.roleArn
    };

    if (props.gremlinCsvLoaderConfig.Enabled) {
      new EcsService(this, 'gremlin-csv-loader-ecs-service', {
        deployment: props.deployment,
        ecsCluster: props.ecsCluster,
        serviceName: 'gremlin-csv-loader',
        memoryLimitMiB: props.gremlinCsvLoaderConfig.MemoryLimitMiB,
        cpu: props.gremlinCsvLoaderConfig.Cpu,
        policyStatements: policyStatements,
        containerImageDirectory: './assets/containers/gremlin-csv-loader/',
        environment: environment,
        desiredCount: 1,
        enableXray: props.commonConfig.XRayEnabled,
        securityGroups: [props.databaseClientSecurityGroup]
      });
    }
  }

  private defineTaskRolePolicyStatements(): iam.PolicyStatement[] {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:Get*'
        ],
        resources: [
          this.props.s3Bucket.arnForObjects('*')
        ]
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage'
        ],
        resources: [
          this.queue.queueArn
        ]
      })
    ];
  }
}