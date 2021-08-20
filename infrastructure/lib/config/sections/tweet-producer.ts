import { getNumber, getString } from '../utils'

export interface TweetProducerConfig
{
    readonly Filter: string;
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
}

export function getConfig(object: { [name: string]: any }): TweetProducerConfig
{
    return {
        Filter: getString(object, 'Filter'),
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu')
    };
}