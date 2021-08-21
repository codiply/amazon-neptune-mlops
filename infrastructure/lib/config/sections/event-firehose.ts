import { getNumber, getString } from '../utils'

export interface EventFirehoseConfig
{
    readonly BufferingIntervalSeconds: number;
    readonly BufferingSizeMiB: number;
    readonly DataOutputExpirationDays: number;
    readonly ErrorOutputExpirationDays: number;
}

export function getConfig(object: { [name: string]: any }): EventFirehoseConfig
{
    return {
        BufferingIntervalSeconds: getNumber(object, 'BufferingIntervalSeconds'),
        BufferingSizeMiB: getNumber(object, 'BufferingSizeMiB'),
        DataOutputExpirationDays: getNumber(object, 'DataOutputExpirationDays'),
        ErrorOutputExpirationDays: getNumber(object, 'ErrorOutputExpirationDays')
    };
}