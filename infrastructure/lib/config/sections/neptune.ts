import { getString } from '../utils'

export interface NeptuneConfig
{
    readonly InstanceType: string;
}

export function getConfig(object: { [name: string]: any }): NeptuneConfig
{
    return {
      InstanceType: getString(object, 'InstanceType'),
    };
}