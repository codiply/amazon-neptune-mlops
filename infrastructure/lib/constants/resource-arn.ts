import * as cdk from '@aws-cdk/core';
import { DeploymentConfig } from '../config/deployment-config';
import { ResourceNames } from './resource-names';

export class ResourceArn {
  static bucket(deployment: DeploymentConfig): string {
    return `arn:aws:s3:::${ResourceNames.bucketName(deployment)}`;
  }
}