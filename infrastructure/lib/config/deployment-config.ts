
import { getString, getStringList } from "./utils";

export interface DeploymentConfig
{
    readonly AWSAccountID : string;
    readonly AWSRegion : string;
    readonly Project: string;
    readonly Environment: string;
    readonly AllowedIpRanges: string[];
    readonly Prefix: string;
}

export function getDeploymentConfig(object: { [name: string]: any }): DeploymentConfig 
{
    const project = getString(object, 'Project');
    const environment = getString(object, 'Environment');
    return {
        AWSAccountID: getString(object, 'AWSAccountID'),
        AWSRegion: getString(object, 'AWSRegion'),
        Project: project,
        Environment: environment,
        AllowedIpRanges: getStringList(object, 'AllowedIpRanges'),
        Prefix: `${project}-${environment}`
    };
}