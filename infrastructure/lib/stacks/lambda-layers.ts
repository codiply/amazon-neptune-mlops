import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { DeploymentConfig } from '../config/deployment-config';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python';

export interface LambdaLayersProps extends cdk.StackProps {
  readonly deployment: DeploymentConfig;
}

export interface LambdaLayersVersions {
  readonly benedict: lambda.LayerVersion;
  readonly requests: lambda.LayerVersion;
  readonly xray: lambda.LayerVersion;
}

export class LambdaLayersStack extends cdk.Stack {
  public versions: LambdaLayersVersions;

  constructor(scope: cdk.App, id: string, props: LambdaLayersProps) {
    super(scope, id, props);

    const xrayLambdaLayer = new PythonLayerVersion(this, 'xray-lambda-layer', {
      layerVersionName: `${props.deployment.Prefix}-aws-xray-sdk`,
      entry: './assets/lambda-layers/aws-xray-sdk',
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8]
    });

    const requestsLambdaLayer = new PythonLayerVersion(this, 'requests-lambda-layer', {
      layerVersionName: `${props.deployment.Prefix}-requests`,
      entry: './assets/lambda-layers/requests',
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8]
    });

    const benedictLambdaLayer = new PythonLayerVersion(this, 'benedict-lambda-layer', {
      layerVersionName: `${props.deployment.Prefix}-benedict`,
      entry: './assets/lambda-layers/benedict',
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8]
    });

    this.versions = {
      benedict: benedictLambdaLayer,
      requests: requestsLambdaLayer,
      xray: xrayLambdaLayer
    }
  }
}
