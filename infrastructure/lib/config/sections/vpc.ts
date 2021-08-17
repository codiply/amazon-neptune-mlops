import { getBoolean, getNumber, getString } from '../utils'

export interface VpcConfig
{
    readonly CidrRange: string;
    readonly MaxAZs: number;
    readonly NatGateways: number;
    readonly UseNatInstances: boolean;
}

export function getConfig(object: { [name: string]: any }): VpcConfig
{
    return {
        CidrRange: getString(object, 'CidrRange'),
        MaxAZs: getNumber(object, 'MaxAZs'),
        NatGateways: getNumber(object, 'NatGateways'),
        UseNatInstances: getBoolean(object, 'UseNatInstances')
    };
}