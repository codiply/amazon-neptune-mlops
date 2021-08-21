import { getNumber, getString } from '../utils'

export interface GremlinCsvConfig
{
    readonly ExpirationDays: number;
}

export function getConfig(object: { [name: string]: any }): GremlinCsvConfig
{
    return {
        ExpirationDays: getNumber(object, 'ExpirationDays')
    };
}