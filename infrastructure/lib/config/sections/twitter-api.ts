import { getString } from '../utils'

export interface TwitterApiConfig
{
    readonly ConsumerKeySsmParameter: string;
    readonly ConsumerSecretSsmParameter: string;
    readonly AccessTokenSsmParameter: string;
    readonly AccessTokenSecretSsmParameter: string;
}

export function getConfig(object: { [name: string]: any }): TwitterApiConfig
{
    return {
        ConsumerKeySsmParameter: getString(object, 'ConsumerKeySsmParameter'),
        ConsumerSecretSsmParameter: getString(object, 'ConsumerSecretSsmParameter'),
        AccessTokenSsmParameter: getString(object, 'AccessTokenSsmParameter'),
        AccessTokenSecretSsmParameter: getString(object, 'AccessTokenSecretSsmParameter')
    };
}
