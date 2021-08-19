import { getBoolean } from '../utils'

export interface EcsClusterConfig
{
    readonly ContainerInsightsEnabled: boolean;
}

export function getConfig(object: { [name: string]: any }): EcsClusterConfig
{
    return {
        ContainerInsightsEnabled: getBoolean(object, 'ContainerInsightsEnabled')
    };
}