import { getNumber } from '../utils'

export interface WikimediaEventsProducerConfig
{
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
}

export function getConfig(object: { [name: string]: any }): WikimediaEventsProducerConfig
{
    return {
      MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
      Cpu: getNumber(object, 'Cpu')
    };
}