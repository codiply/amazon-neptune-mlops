import { getBoolean, getString } from '../utils'

export interface NeptuneNotebookConfig
{
    readonly InstanceType: string;
    readonly PersistentDirectory: string;
}

export function getConfig(object: { [name: string]: any }): NeptuneNotebookConfig
{
    return {
        InstanceType: getString(object, 'InstanceType'),
        PersistentDirectory: getString(object, 'PersistentDirectory')
    };
}
