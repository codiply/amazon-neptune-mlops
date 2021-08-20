import { getNumber, getString } from '../utils'

export interface WikimediaEventsProducerConfig
{
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
    readonly WikiRegex: string;
}

export function getConfig(object: { [name: string]: any }): WikimediaEventsProducerConfig
{
    return {
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu'),
        WikiRegex: getString(object, 'WikiRegex')
    };
}