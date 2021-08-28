import * as cdk from '@aws-cdk/core';
import { DeploymentConfig } from '../config/deployment-config';

export class ResourceNames {
  static bucketName(deployment: DeploymentConfig): string {
    return `${deployment.Prefix}-${cdk.Aws.ACCOUNT_ID}`;
  }
  static sagemakerExecutionRole(deployment: DeploymentConfig): string {
    return `${deployment.Prefix}-sagemaker-execution-role`;
  }
  static neptuneSagemakerRole(deployment: DeploymentConfig): string {
    return `${deployment.Prefix}-neptune-sagemaker-role`;
  }
}