import { getBoolean } from '../utils'

export interface CommonConfig
{
    readonly XRayEnabled: boolean;
}

export function getConfig(object: { [name: string]: any }): CommonConfig
{
    return {
        XRayEnabled: getBoolean(object, 'XRayEnabled')
    };
}