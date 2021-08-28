import { DeploymentConfig } from '../config/deployment-config';
import { ResourceNames } from './resource-names';

export class ResourceArn {
  static bucket(deployment: DeploymentConfig): string {
    return `arn:aws:s3:::${ResourceNames.bucketName(deployment)}`;
  }
  static sagemakerExecutionRole(deployment: DeploymentConfig): string {
    return `arn:aws:iam::${deployment.AWSAccountID}:role/${ResourceNames.sagemakerExecutionRole(deployment)}`;
  }
  static neptuneSagemakerRole(deployment: DeploymentConfig): string {
    return `arn:aws:iam::${deployment.AWSAccountID}:role/${ResourceNames.neptuneSagemakerRole(deployment)}`;
  }
}