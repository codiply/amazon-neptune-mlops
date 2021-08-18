import { getBoolean, getString } from '../utils'

export interface NeptuneNotebookConfig
{
    readonly InstanceType: string;
    readonly Encrypted: boolean;
    readonly EnableAutomaticBackups: boolean;
    readonly PersistentDirectory: string;
}

export function getConfig(object: { [name: string]: any }): NeptuneNotebookConfig
{
    return {
      InstanceType: getString(object, 'InstanceType'),
      Encrypted: getBoolean(object, 'Encrypted'),
      EnableAutomaticBackups: getBoolean(object, 'EnableAutomaticBackups'),
      PersistentDirectory: getString(object, 'PersistentDirectory')
    };
}
