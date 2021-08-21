import * as cdk from '@aws-cdk/core';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as firehosedestinations from '@aws-cdk/aws-kinesisfirehose-destinations';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { EventFirehoseConfig } from '../config/sections/event-firehose';
import { ServicePrincipals } from '../constants/service-principals';
import { S3Paths } from '../constants/s3-paths';
import { ResourceArn } from '../constants/resource-arn';
import { PythonFunction } from '@aws-cdk/aws-lambda-python';

export interface EventFirehoseProps {
  readonly deployment: DeploymentConfig;
  readonly eventsName: string;
  readonly eventFirehoseConfig: EventFirehoseConfig;
  readonly s3Bucket: s3.Bucket;
  readonly pathPrefix: string;
}
  
export class EventFirehose extends cdk.Construct {
  private props: EventFirehoseProps;
  
  public readonly deliveryStream: firehose.DeliveryStream;
 
  constructor(scope: cdk.Construct, id: string, props: EventFirehoseProps) {
    super(scope, id);

    this.props = props;

    const role = this.defineRole();

    const datePath = 'year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}';

    const lambdaFunction = new PythonFunction(this, 'processor-lambda-function', {
      functionName: `${props.deployment.Prefix}-${props.eventsName}-delivery-stream-processor`,
      entry: `./assets/lambdas/event-firehose-processor`,
        runtime: lambda.Runtime.PYTHON_3_8,
        index: 'lambda-handler.py',
        handler: 'main',
    });

    const lambdaProcessor = new firehose.LambdaFunctionProcessor(lambdaFunction);

    const deliveryStream = new firehose.DeliveryStream(this, 'firehose-delivery-stream', {
      deliveryStreamName: `${props.deployment.Prefix}-${props.eventsName}-delivery-stream`,
      destinations: [
        new firehosedestinations.S3Bucket(props.s3Bucket, {
          processor: lambdaProcessor,
          role: role,
          bufferingInterval: cdk.Duration.seconds(props.eventFirehoseConfig.BufferingIntervalSeconds),
          bufferingSize: cdk.Size.mebibytes(props.eventFirehoseConfig.BufferingSizeMiB),
          dataOutputPrefix: `${props.pathPrefix}/${S3Paths.RAW_EVENTS}/${datePath}/`,
          errorOutputPrefix: `${props.pathPrefix}/${S3Paths.RAW_EVENTS_FIREHOSE_ERROR}/result=!{firehose:error-output-type}/${datePath}/`
        })
      ]
    });
    this.deliveryStream = deliveryStream;

    this.addS3LifecycleRules();
  }

  private defineRole(): iam.Role {
    const role = new iam.Role(this, 'delivery-stream-role', {
      roleName: `${this.props.deployment.Prefix}-${this.props.eventsName}-firehose-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.FIREHOSE)
    });
    
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:AbortMultipartUpload',
        's3:GetBucketLocation',
        's3:GetObject',
        's3:ListBucket',
        's3:ListBucketMultipartUploads',
        's3:PutObject'
      ],
      resources: [
        ResourceArn.bucket(this.props.deployment),
        `${ResourceArn.bucket(this.props.deployment)}/${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}/*`,
        `${ResourceArn.bucket(this.props.deployment)}/${this.props.pathPrefix}/${S3Paths.RAW_EVENTS_FIREHOSE_ERROR}/*`
      ]
    }));

    return role;
  }

  private addS3LifecycleRules(): void {
    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}/`,
      expiration: cdk.Duration.days(this.props.eventFirehoseConfig.DataOutputExpirationDays)
    });

    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.props.pathPrefix}/${S3Paths.RAW_EVENTS_FIREHOSE_ERROR}/`,
      expiration: cdk.Duration.days(this.props.eventFirehoseConfig.ErrorOutputExpirationDays)
    });
  }
}