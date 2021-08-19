import * as cdk from '@aws-cdk/core';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as firehosedestinations from '@aws-cdk/aws-kinesisfirehose-destinations';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import { DeploymentConfig } from '../config/deployment-config';
import { TweetFirehoseConfig } from '../config/sections/tweet-firehose';
import { ServicePrincipals } from '../constants/constants';

export interface TweetFirehoseProps {
  readonly deployment: DeploymentConfig;
  readonly tweetFirehoseConfig: TweetFirehoseConfig;
  readonly s3Bucket: s3.Bucket;
}
  
export class TweetFirehose extends cdk.Construct {
  public readonly deliveryStream: firehose.DeliveryStream;
 
  constructor(scope: cdk.Construct, id: string, props: TweetFirehoseProps) {
    super(scope, id);

    const role = new iam.Role(this, 'delivery-stream-role', {
      roleName: `${props.deployment.Prefix}-tweet-firehose-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.FIREHOSE)
    })
    
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
        `arn:aws:s3:::${props.s3Bucket.bucketName}`,
        `arn:aws:s3:::${props.s3Bucket.bucketName}/${props.tweetFirehoseConfig.DataOutputPrefix}/*`,
        `arn:aws:s3:::${props.s3Bucket.bucketName}/${props.tweetFirehoseConfig.ErrorOutputPrefix}/*`
      ]
    }));

    const deliveryStream = new firehose.DeliveryStream(this, 'firehose-delivery-stream', {
      deliveryStreamName: `${props.deployment.Prefix}-tweet-delivery-stream`,
      destinations: [
        new firehosedestinations.S3Bucket(props.s3Bucket, {
          role: role,
          bufferingInterval: cdk.Duration.seconds(props.tweetFirehoseConfig.BufferingIntervalSeconds),
          bufferingSize: cdk.Size.mebibytes(props.tweetFirehoseConfig.BufferingSizeMebibytes),
          dataOutputPrefix: `${props.tweetFirehoseConfig.DataOutputPrefix}/!{timestamp:yyyy/MM/dd}`,
          errorOutputPrefix: `${props.tweetFirehoseConfig.ErrorOutputPrefix}/result=!{firehose:error-output-type}/!{timestamp:yyyy/MM/dd}`
        })
      ]
    });

    this.deliveryStream = deliveryStream;
  }
}