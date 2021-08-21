import { getNumber, getString } from '../utils'

export interface TweetsProducerConfig
{
    readonly Filter: string;
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
}

export function getConfig(object: { [name: string]: any }): TweetsProducerConfig
{
    return {
        Filter: getString(object, 'Filter'),
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu')
    };
}