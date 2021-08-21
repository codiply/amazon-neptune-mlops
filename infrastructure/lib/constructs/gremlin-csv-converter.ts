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
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python';
import { GremlinCsvConverterConfig } from '../config/sections/gremlin-csv-converter';
import { LambdaLayersVersions } from '../stacks/lambda-layers';
import { ResourceArn } from '../constants/resource-arn';

export interface GremlinCsvConverterProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly gremlinCsvConverter: GremlinCsvConverterConfig;
  readonly gremlinCsvConfig: GremlinCsvConfig;
  readonly eventsName: string;
  readonly pathPrefix: string;
  readonly s3Bucket: s3.Bucket;
  readonly loaderQueue: sqs.Queue;
  readonly lambdaLayersVersions: LambdaLayersVersions;
  readonly policyStatements?: iam.PolicyStatement[];
}
  
export class GremlinCsvConverter extends cdk.Construct {
  private props: GremlinCsvConverterProps;

  constructor(scope: cdk.Construct, id: string, props: GremlinCsvConverterProps) {
    super(scope, id);

    this.props = props;

    const role = this.defineLambdaExecutionRole();

    const environment = {

    };

    const func = this.defineLambdaFunction(role, environment)

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
        `${ResourceArn.bucket(this.props.deployment)}/${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}/*`,
        `${ResourceArn.bucket(this.props.deployment)}/${this.props.pathPrefix}/${S3Paths.RAW_EVENTS_FIREHOSE_ERROR}/*`
      ]
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
      ],
      resources: [
        `${ResourceArn.bucket(this.props.deployment)}/${this.props.pathPrefix}/${S3Paths.GREMLIN_CSV}/*`
      ]
    }));

    if (this.props.policyStatements) {
      this.props.policyStatements.forEach(statement => role.addToPolicy(statement));
    }

    return role;
  }

  private defineLambdaFunction(
    role: iam.Role, 
    environment: {[key: string]: string;}): PythonFunction {
      const func = new PythonFunction(this, `lambda-function`, {
        functionName: `${this.props.deployment.Prefix}-${this.props.eventsName}-gremlin-csv-converter`,
        description: `Converts ${this.props.eventsName} to Gremlin CSV and submits for loading for ${this.props.deployment.Prefix} in ${this.props.deployment.Environment}`,
        entry: `./assets/lambdas/gremlin-csv-converter`,
        runtime: lambda.Runtime.PYTHON_3_8,
        index: 'lambda-handler.py',
        handler: 'main',
        environment: environment,
        layers: [this.props.lambdaLayersVersions.xray],
        role: role,
        timeout: cdk.Duration.seconds(this.props.gremlinCsvConverter.LambdaTimeoutSeconds),
        logRetention: logs.RetentionDays.THREE_DAYS,
        tracing: this.props.commonConfig.XRayEnabled ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED
      });
      return func;
  }

  private addS3LifecycleRules(): void {
    this.props.s3Bucket.addLifecycleRule({
      prefix: `${this.props.pathPrefix}/${S3Paths.RAW_EVENTS}/`,
      expiration: cdk.Duration.days(this.props.gremlinCsvConfig.ExpirationDays)
    });
  }
}