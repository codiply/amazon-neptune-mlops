import { getBoolean, getString } from '../utils'

export interface NeptuneNotebookEfsConfig
{
    readonly Encrypted: boolean;
    readonly EnableAutomaticBackups: boolean;
}

export function getConfig(object: { [name: string]: any }): NeptuneNotebookEfsConfig
{
    return {
      Encrypted: getBoolean(object, 'Encrypted'),
      EnableAutomaticBackups: getBoolean(object, 'EnableAutomaticBackups')
    };
}
