import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as neptune from '@aws-cdk/aws-neptune';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import { DeploymentConfig } from '../config/deployment-config';
import { NeptuneConfig } from '../config/sections/neptune';
import { NeptuneDatabase } from '../constructs/neptune-database';
import { GremlinCsvLoaderConfig } from '../config/sections/gremlin-csv-loader';
import { GremlinCsvLoader } from '../constructs/gremlin-csv-loader';
import { ServicePrincipals } from '../constants/service-principals';
import { CommonConfig } from '../config/sections/common';

export interface NeptuneDatabaseStackProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly neptuneConfig: NeptuneConfig;
  readonly gremlinCsvLoaderConfig: GremlinCsvLoaderConfig;
  readonly vpc: ec2.Vpc;
  readonly ecsCluster: ecs.Cluster;
  readonly s3Bucket: s3.Bucket;
  readonly neptuneSagemakerRole: iam.Role;
  readonly sagemakerExecutionRole: iam.Role;
  readonly sagemakerVpcEndpointClientSecurityGroup: ec2.SecurityGroup;
}

export class NeptuneDatabaseStack extends cdk.Stack {
  private readonly props: NeptuneDatabaseStackProps;

  public readonly cluster: neptune.DatabaseCluster;
  public readonly databaseClientSecurityGroup: ec2.SecurityGroup;
  public readonly loaderQueue: sqs.Queue;

  constructor(scope: cdk.App, id: string, props: NeptuneDatabaseStackProps) {
    super(scope, id, props);

    this.props = props;
    
    const loaderRole = this.defineLoaderRole();

    const neptuneDatabase = new NeptuneDatabase(this, 'neptune-database', {
      deployment: props.deployment,
      neptuneConfig: props.neptuneConfig,
      vpc: props.vpc,
      loaderRole: loaderRole,
      neptuneSagemakerRole: props.neptuneSagemakerRole,
      sagemakerExecutionRole: props.sagemakerExecutionRole,
      sagemakerVpcEndpointClientSecurityGroup: props.sagemakerVpcEndpointClientSecurityGroup
    });
    this.cluster = neptuneDatabase.cluster;
    this.databaseClientSecurityGroup = neptuneDatabase.databaseClientSecurityGroup;

    const gremlinCsvLoader = new GremlinCsvLoader(this, 'gremlin-csv-loader', {
      deployment: props.deployment,
      commonConfig: props.commonConfig,
      gremlinCsvLoaderConfig: props.gremlinCsvLoaderConfig,
      ecsCluster: props.ecsCluster,
      s3Bucket: props.s3Bucket,
      databaseClientSecurityGroup: neptuneDatabase.databaseClientSecurityGroup,
      databaseClusterEndpoint: neptuneDatabase.cluster.clusterEndpoint,
      loaderRole: loaderRole
    });
    this.loaderQueue = gremlinCsvLoader.queue;
  }

  private defineLoaderRole(): iam.Role {
    const role = new iam.Role(this, 'neptune-database-loader-role', {
      roleName: `${this.props.deployment.Prefix}-neptune-database-loader-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.RDS)
    });
    
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:List*',
        's3:Get*'
      ],
      resources: [
        this.props.s3Bucket.bucketArn,
        this.props.s3Bucket.arnForObjects('*')
      ]
    }));

    return role;
  }
}
