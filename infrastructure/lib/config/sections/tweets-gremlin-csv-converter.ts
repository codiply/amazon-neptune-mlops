import { getStringList } from '../utils'

export interface TweetsGremlinCsvConverterConfig
{
    readonly AllowedLanguages: string[];
}

export function getConfig(object: { [name: string]: any }): TweetsGremlinCsvConverterConfig
{
    return {
        AllowedLanguages: getStringList(object, 'AllowedLanguages')
    };
}