export class Constants {
  static get NEPTUNE_PORT(): number {
    return 8182;
  }
  static get EFS_PORT(): number {
    return 2049;
  }
}

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
  static get RDS(): string {
    return 'rds.amazonaws.com';
  }
  static get SAGEMAKER(): string {
    return 'sagemaker.amazonaws.com';
  }
}