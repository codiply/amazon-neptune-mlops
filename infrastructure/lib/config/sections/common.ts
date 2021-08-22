import { getBoolean, getNumber } from '../utils'

export interface CommonConfig
{
    readonly XRayEnabled: boolean;
    readonly EcsCapacityProviderFargateWeight: number;
    readonly EcsCapacityProviderFargateSpotWeight: number;
}

export function getConfig(object: { [name: string]: any }): CommonConfig
{
    return {
        XRayEnabled: getBoolean(object, 'XRayEnabled'),
        EcsCapacityProviderFargateWeight: getNumber(object, 'EcsCapacityProviderFargateWeight'),
        EcsCapacityProviderFargateSpotWeight: getNumber(object, 'EcsCapacityProviderFargateSpotWeight')
    };
}