import { getString } from '../utils'

export interface TweetsConfig
{
    readonly S3PathPrefix: string;
}

export function getConfig(object: { [name: string]: any }): TweetsConfig
{
    return {
        S3PathPrefix: getString(object, 'S3PathPrefix'),
    };
}