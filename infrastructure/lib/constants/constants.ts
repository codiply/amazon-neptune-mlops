export class Constants {
  static get NEPTUNE_PORT(): number {
    return 8182;
  }
  static get EFS_PORT(): number {
    return 2049;
  }
}

export class ServicePrincipals {
  static get SAGEMAKER(): string {
      return 'sagemaker.amazonaws.com';
  };
}