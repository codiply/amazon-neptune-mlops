import * as cdk from '@aws-cdk/core';
import { DeploymentConfig } from '../config/deployment-config';

export class ResourceNames {
  static bucketName(deployment: DeploymentConfig): string {
    return `${deployment.Prefix}-${cdk.Aws.ACCOUNT_ID}`;
  }
}