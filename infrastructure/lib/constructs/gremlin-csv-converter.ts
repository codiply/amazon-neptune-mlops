import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3n from '@aws-cdk/aws-s3-notifications';
import * as sqs from '@aws-cdk/aws-sqs';
import { DeploymentConfig } from '../config/deployment-config';
import { CommonConfig } from '../config/sections/common';
import { ServicePrincipals } from '../constants/service-principals';
import { S3Paths } from '../constants/s3-paths';
import { GremlinCsvConfig } from '../config/sections/gremlin-csv';
import { GremlinCsvConverterConfig } from '../config/sections/gremlin-csv-converter';
import { LambdaLayersVersions } from '../stacks/lambda-layers';
import { ResourceArn } from '../constants/resource-arn';
import { ResourceNames } from '../constants/resource-names';

export interface GremlinCsvConverterProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly gremlinCsvConverter: GremlinCsvConverterConfig;
  readonly gremlinCsvConfig: GremlinCsvConfig;
  readonly eventsName: string;
  readonly pathPrefix: string;
  readonly s3Bucket: s3.Bucket;
  readonly loaderQueue: sqs.Queue;
  readonly convertersLayerAssetPath: string;
  readonly lambdaLayersVersions: LambdaLayersVersions;
}
  
export class GremlinCsvConverter extends cdk.Construct {
  private props: GremlinCsvConverterProps;
  private inputPath: string;
  private outputPath: string;

  constructor(scope: cdk.Construct, id: string, props: GremlinCsvConverterProps) {
    super(scope, id);

    this.props = props;

    this.inputPath = `${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}`;
    this.outputPath = `${this.props.pathPrefix}/${S3Paths.GREMLIN_CSV}`;

    const role = this.defineLambdaExecutionRole();

    const environment = {
      LOADER_QUEUE_URL: props.loaderQueue.queueUrl,
      S3_BUCKET: ResourceNames.bucketName(props.deployment),
      INPUT_PATH: this.inputPath,
      OUTPUT_PATH: this.outputPath
    };

    const convertersLayer = new lambda.LayerVersion(this, 'converters', {
      layerVersionName: `${this.props.deployment.Prefix}-${this.props.eventsName}-gremlin-csv-converter`,
      code: lambda.Code.fromAsset(props.convertersLayerAssetPath),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8]
    });

    const func = this.defineLambdaFunction(role, convertersLayer, environment)

    s3.Bucket.fromBucketArn(this, "bucket-from-arn", 
      ResourceArn.bucket(this.props.deployment)).addObjectCreatedNotification(
        new s3n.LambdaDestination(func), { 
          prefix: `${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}` });

    this.addS3LifecycleRules();
  }

  private defineLambdaExecutionRole(): iam.Role {
    const role = new iam.Role(this, 'gremlin-csv-converter-role', {
      roleName: `${this.props.deployment.Prefix}-${this.props.eventsName}-gremlin-csv-converter-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.LAMBDA)
    });
    
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:Get*',
        's3:List*'
      ],
      resources: [
        ResourceArn.bucket(this.props.deployment),
        `${ResourceArn.bucket(this.props.deployment)}/${this.inputPath}/*`
      ]
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
      ],
      resources: [
        `${ResourceArn.bucket(this.props.deployment)}/${this.outputPath}/*`
      ]
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:SendMessage',
      ],
      resources: [
        this.props.loaderQueue.queueArn
      ]
    }));

    return role;
  }

  private defineLambdaFunction(
    role: iam.Role, 
    convertersLayer: lambda.ILayerVersion,
    environment: {[key: string]: string;}): lambda.Function {

      const func = new lambda.Function(this, `lambda-function`, {
        functionName: `${this.props.deployment.Prefix}-${this.props.eventsName}-gremlin-csv-converter`,
        description: `Converts ${this.props.eventsName} to Gremlin CSV and submits for loading for ${this.props.deployment.Project} in ${this.props.deployment.Environment}`,
        code: lambda.Code.fromAsset(`./assets/lambdas/gremlin-csv-converter`),
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: 'lambda-handler.main',
        environment: environment,
        layers: [this.props.lambdaLayersVersions.xray, convertersLayer],
        role: role,
        timeout: cdk.Duration.seconds(this.props.gremlinCsvConverter.LambdaTimeoutSeconds),
        logRetention: logs.RetentionDays.THREE_DAYS,
        tracing: this.props.commonConfig.XRayEnabled ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED
      });
      return func;
  }

  private addS3LifecycleRules(): void {
    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.inputPath}/`,
      expiration: cdk.Duration.days(this.props.gremlinCsvConfig.ExpirationDays)
    });
  }
}