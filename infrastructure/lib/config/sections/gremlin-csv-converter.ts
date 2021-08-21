import { getNumber } from '../utils'

export interface GremlinCsvConverterConfig
{
    readonly LambdaTimeoutSeconds: number;
}

export function getConfig(object: { [name: string]: any }): GremlinCsvConverterConfig
{
    return {
        LambdaTimeoutSeconds: getNumber(object, 'LambdaTimeoutSeconds')
    };
}