import { getNumber, getString } from '../utils'

export interface EventFirehoseConfig
{
    readonly BufferingIntervalSeconds: number;
    readonly BufferingSizeMiB: number;
    readonly DataOutputPrefix: string;
    readonly ErrorOutputPrefix: string;
    readonly DataOutputExpirationDays: number;
    readonly ErrorOutputExpirationDays: number;
}

export function getConfig(object: { [name: string]: any }): EventFirehoseConfig
{
    return {
      BufferingIntervalSeconds: getNumber(object, 'BufferingIntervalSeconds'),
      BufferingSizeMiB: getNumber(object, 'BufferingSizeMiB'),
      DataOutputPrefix: getString(object, 'DataOutputPrefix'),
      ErrorOutputPrefix: getString(object, 'ErrorOutputPrefix'),
      DataOutputExpirationDays: getNumber(object, 'DataOutputExpirationDays'),
      ErrorOutputExpirationDays: getNumber(object, 'ErrorOutputExpirationDays')
    };
}