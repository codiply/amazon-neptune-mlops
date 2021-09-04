import { getNumber } from '../utils'

export interface NeptuneExporterConfig
{
    readonly MemoryLimitMiB: number;
    readonly Cpu: number;
}

export function getConfig(object: { [name: string]: any }): NeptuneExporterConfig
{
    return {
        MemoryLimitMiB: getNumber(object, 'MemoryLimitMiB'),
        Cpu: getNumber(object, 'Cpu')
    };
}