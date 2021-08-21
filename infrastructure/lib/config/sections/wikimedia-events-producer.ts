import { getBoolean, getNumber, getString } from '../utils'

export interface WikimediaEventsProducerConfig
{
    readonly Enabled: boolean,
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
    readonly WikiRegex: string;
}

export function getConfig(object: { [name: string]: any }): WikimediaEventsProducerConfig
{
    return {
        Enabled: getBoolean(object, 'Enabled'),
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu'),
        WikiRegex: getString(object, 'WikiRegex')
    };
}