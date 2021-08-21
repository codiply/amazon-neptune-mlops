import { getString } from '../utils'

export interface WikimediaEventsConfig
{
    readonly S3PathPrefix: string;
}

export function getConfig(object: { [name: string]: any }): WikimediaEventsConfig
{
    return {
        S3PathPrefix: getString(object, 'S3PathPrefix')
    };
}