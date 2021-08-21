import * as cdk from '@aws-cdk/core';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as firehosedestinations from '@aws-cdk/aws-kinesisfirehose-destinations';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { EventFirehoseConfig } from '../config/sections/event-firehose';
import { ServicePrincipals } from '../constants/constants';

export interface EventFirehoseProps {
  readonly deployment: DeploymentConfig;
  readonly name: string;
  readonly eventFirehoseConfig: EventFirehoseConfig;
  readonly s3Bucket: s3.Bucket;
}
  
export class EventFirehose extends cdk.Construct {
  private props: EventFirehoseProps;

  public readonly deliveryStream: firehose.DeliveryStream;
 
  constructor(scope: cdk.Construct, id: string, props: EventFirehoseProps) {
    super(scope, id);

    this.props = props;

    const role = this.defineRole();

    const datePath = 'year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}';

    const deliveryStream = new firehose.DeliveryStream(this, 'firehose-delivery-stream', {
      deliveryStreamName: `${props.deployment.Prefix}-${props.name}-delivery-stream`,
      destinations: [
        new firehosedestinations.S3Bucket(props.s3Bucket, {
          role: role,
          bufferingInterval: cdk.Duration.seconds(props.eventFirehoseConfig.BufferingIntervalSeconds),
          bufferingSize: cdk.Size.mebibytes(props.eventFirehoseConfig.BufferingSizeMiB),
          dataOutputPrefix: `${props.eventFirehoseConfig.DataOutputPrefix}/${datePath}/`,
          errorOutputPrefix: `${props.eventFirehoseConfig.ErrorOutputPrefix}/result=!{firehose:error-output-type}/${datePath}/`
        })
      ]
    });
    this.deliveryStream = deliveryStream;

    this.addS3LifecycleRules();
  }

  private defineRole(): iam.Role {
    const role = new iam.Role(this, 'delivery-stream-role', {
      roleName: `${this.props.deployment.Prefix}-${this.props.name}-firehose-role`,
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
        `arn:aws:s3:::${this.props.s3Bucket.bucketName}`,
        `arn:aws:s3:::${this.props.s3Bucket.bucketName}/${this.props.eventFirehoseConfig.DataOutputPrefix}/*`,
        `arn:aws:s3:::${this.props.s3Bucket.bucketName}/${this.props.eventFirehoseConfig.ErrorOutputPrefix}/*`
      ]
    }));

    return role;
  }

  private addS3LifecycleRules(): void {
    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.props.eventFirehoseConfig.DataOutputPrefix}/`,
      expiration: cdk.Duration.days(this.props.eventFirehoseConfig.DataOutputExpirationDays)
    });

    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.props.eventFirehoseConfig.ErrorOutputPrefix}/`,
      expiration: cdk.Duration.days(this.props.eventFirehoseConfig.ErrorOutputExpirationDays)
    });
  }
}