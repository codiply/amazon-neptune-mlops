import { getNumber, getString } from '../utils'

export interface TweetFirehoseConfig
{
    readonly BufferingIntervalSeconds: number;
    readonly BufferingSizeMebibytes: number;
    readonly DataOutputPrefix: string;
    readonly ErrorOutputPrefix: string;
}

export function getConfig(object: { [name: string]: any }): TweetFirehoseConfig
{
    return {
      BufferingIntervalSeconds: getNumber(object, 'BufferingIntervalSeconds'),
      BufferingSizeMebibytes: getNumber(object, 'BufferingSizeMebibytes'),
      DataOutputPrefix: getString(object, 'DataOutputPrefix'),
      ErrorOutputPrefix: getString(object, 'ErrorOutputPrefix')
    };
}