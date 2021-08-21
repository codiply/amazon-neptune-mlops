export class ServicePrincipals {
  static get ECS(): string {
    return 'ecs.amazonaws.com';
  }
  static get ECS_TASK(): string {
    return 'ecs-tasks.amazonaws.com'
  }
  static get FIREHOSE(): string {
    return 'firehose.amazonaws.com';
  }
  static get LAMBDA(): string {
    return 'lambda.amazonaws.com';
  }
  static get RDS(): string {
    return 'rds.amazonaws.com';
  }
  static get SAGEMAKER(): string {
    return 'sagemaker.amazonaws.com';
  }
}