import { getBoolean, getNumber } from '../utils'

export interface GremlinCsvLoaderConfig
{
    readonly Enabled: boolean;
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
}

export function getConfig(object: { [name: string]: any }): GremlinCsvLoaderConfig
{
    return {
        Enabled: getBoolean(object, 'Enabled'),
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu')
    };
}