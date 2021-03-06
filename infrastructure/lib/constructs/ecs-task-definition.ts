import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import { DeploymentConfig } from '../config/deployment-config';
import { ServicePrincipals } from '../constants/service-principals';
import { CommonConfig } from '../config/sections/common';

export interface EcsTaskDefinitionProps {
  readonly deployment: DeploymentConfig;
  readonly commonConfig: CommonConfig;
  readonly ecsCluster: ecs.Cluster;
  readonly taskName: string;
  readonly memoryLimitMiB: number;
  readonly cpu: number;
  readonly policyStatements: iam.PolicyStatement[];
  readonly containerImageDirectory: string;
  readonly environment: { [key: string]: string; };
  readonly desiredCount: number;
  readonly awsManagedPolicyNames?: string[];
}
  
export class EcsTaskDefinition extends cdk.Construct {
  private readonly props: EcsTaskDefinitionProps;

  public readonly taskDefinition: ecs.TaskDefinition;

  constructor(scope: cdk.Construct, id: string, props: EcsTaskDefinitionProps) {
    super(scope, id);

    this.props = props;

    const xrayPort = 2000;

    const extraEnvironment = {
      "AWS_XRAY_DAEMON_ADDRESS": `127.0.0.1:${xrayPort}`,
      "AWS_REGION": cdk.Aws.REGION,
      "AWS_ACCOUNT_ID": cdk.Aws.ACCOUNT_ID
    };
    const mergedEnvironment = {...props.environment, ...extraEnvironment};

    const taskRole = this.defineTaskRole();

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'task-definition', {
      memoryLimitMiB: this.props.memoryLimitMiB,
      cpu: this.props.cpu,
      taskRole: taskRole
    });
    this.taskDefinition = taskDefinition;

    const mainContainer = taskDefinition.addContainer('main-container', {
      containerName: 'main-container',
      image: ecs.ContainerImage.fromAsset(props.containerImageDirectory),
      environment: mergedEnvironment,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: `${props.deployment.Prefix}`,
        logRetention: logs.RetentionDays.THREE_DAYS
      }),
    });

    if (props.commonConfig.XRayEnabled) {
      const xrayContainer = taskDefinition.addContainer("xray-container", {
        containerName: 'xray-container',
        image: ecs.ContainerImage.fromRegistry("amazon/aws-xray-daemon:3.3.2"),
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: `${props.deployment.Prefix}`,
          logRetention: logs.RetentionDays.THREE_DAYS
        }),
        command: ["-o"],
        portMappings: [{ containerPort: xrayPort, protocol: ecs.Protocol.TCP },
                      { containerPort: xrayPort, protocol: ecs.Protocol.UDP } ]
      });
    }
  }

  private defineTaskRole(): iam.Role {
    const role = new iam.Role(this, 'task-role', {
      roleName: `${this.props.deployment.Prefix}-${this.props.taskName}-task-role`,
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.ECS_TASK)
    });

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
        actions: [
          'logs:Create*',
          'logs:PutLogEvents'
        ],
        resources: [
          'arn:aws:logs:*:*:*'
        ]
    }))

    this.props.policyStatements.forEach(statement => role.addToPolicy(statement));

    if (this.props.commonConfig.XRayEnabled) {
      role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));
    }
    if (this.props.awsManagedPolicyNames) {
      this.props.awsManagedPolicyNames.forEach(name => 
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(name)));
    }

    return role;
  }
}