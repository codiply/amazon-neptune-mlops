import { getNumber, getString } from '../utils'

export interface EventFirehoseConfig
{
    readonly BufferingIntervalSeconds: number;
    readonly BufferingSizeMiB: number;
    readonly DataOutputPrefix: string;
    readonly ErrorOutputPrefix: string;
}

export function getConfig(object: { [name: string]: any }): EventFirehoseConfig
{
    return {
      BufferingIntervalSeconds: getNumber(object, 'BufferingIntervalSeconds'),
      BufferingSizeMiB: getNumber(object, 'BufferingSizeMiB'),
      DataOutputPrefix: getString(object, 'DataOutputPrefix'),
      ErrorOutputPrefix: getString(object, 'ErrorOutputPrefix')
    };
}