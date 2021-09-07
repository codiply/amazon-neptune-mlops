import * as fs from 'fs'
import * as path from 'path';
import { DeploymentConfig, getDeploymentConfig } from './deployment-config';
import { EcsClusterConfig, getConfig as getEcsClusterConfig } from './sections/ecs-cluster';
import { NeptuneConfig, getConfig as getNeptuneConfig } from './sections/neptune';
import { NeptuneNotebookConfig, getConfig as getNeptuneNotebookConfig } from './sections/neptune-notebook';
import { NeptuneNotebookEfsConfig, getConfig as getNeptuneNotebookEfsConfig } from './sections/neptune-notebook-efs';
import { EventFirehoseConfig, getConfig as getEventFirehoseConfig } from './sections/event-firehose';
import { VpcConfig, getConfig as getVpcConfig } from './sections/vpc';
import { getSection} from './utils';
import { WikimediaEventsProducerConfig, getConfig as getWikimediaEventsProducerConfig } from './sections/wikimedia-events-producer';
import { GremlinCsvLoaderConfig, getConfig as getGremlinCsvLoaderConfig } from './sections/gremlin-csv-loader';
import { CommonConfig, getConfig as getCommonConfig } from './sections/common';
import { WikimediaEventsConfig, getConfig as getWikimediaEventsConfig } from './sections/wikimedia-events';
import { TweetsProducerConfig, getConfig as getTweetsProducerConfig } from './sections/tweets-producer';
import { TwitterApiConfig, getConfig as getTwitterApiConfig } from './sections/twitter-api';
import { TweetsConfig, getConfig as getTweetsConfig } from './sections/tweets';
import { GremlinCsvConverterConfig, getConfig as getGremlinCsvConverterConfig } from './sections/gremlin-csv-converter';
import { GremlinCsvConfig, getConfig as getGremlinCsvConfig } from './sections/gremlin-csv';
import { NeptuneExporterConfig, getConfig as getNeptuneExporterTaskConfig } from './sections/neptune-export-task';
import { TweetsGremlinCsvConverterConfig, getConfig as getTweetsGremlinCsvConverterConfig } from './sections/tweets-gremlin-csv-converter';
const yaml = require('js-yaml');

export interface Config {
    readonly Deployment: DeploymentConfig;
    readonly Common: CommonConfig;
    readonly EcsCluster: EcsClusterConfig;    
    readonly EventFirehose: EventFirehoseConfig;
    readonly GremlinCsv: GremlinCsvConfig;
    readonly GremlinCsvConverter: GremlinCsvConverterConfig;
    readonly GremlinCsvLoader: GremlinCsvLoaderConfig;
    readonly Neptune: NeptuneConfig;
    readonly NeptuneExporter: NeptuneExporterConfig;
    readonly NeptuneNotebook: NeptuneNotebookConfig;
    readonly NeptuneNotebookEfs: NeptuneNotebookEfsConfig;
    readonly Vpc: VpcConfig;
    readonly Tweets: TweetsConfig;
    readonly TweetsGremlinCsvConverter: TweetsGremlinCsvConverterConfig 
    readonly TweetsProducer: TweetsProducerConfig;
    readonly TwitterApi: TwitterApiConfig;
    readonly WikimediaEvents: WikimediaEventsConfig;
    readonly WikimediaEventsProducer: WikimediaEventsProducerConfig;
}
export function getConfig(environmentName: string, configPath: string): Config
{
    let env: string = environmentName ?? 'default';

    let deploymentYaml = yaml.load(fs.readFileSync(path.resolve(configPath+env+'.deployment.yaml'), 'utf8'));
    let configYaml = yaml.load(fs.readFileSync(path.resolve(configPath+env+'.yaml'), 'utf8'));

    let config: Config = {
        Deployment: getDeploymentConfig(deploymentYaml),
        Common: getCommonConfig(getSection(configYaml, 'Common')),
        EcsCluster: getEcsClusterConfig(getSection(configYaml, 'EcsCluster')),
        EventFirehose: getEventFirehoseConfig(getSection(configYaml, 'EventFirehose')),
        GremlinCsv: getGremlinCsvConfig(getSection(configYaml, 'GremlinCsv')),
        GremlinCsvConverter: getGremlinCsvConverterConfig(getSection(configYaml, 'GremlinCsvConverter')),
        GremlinCsvLoader: getGremlinCsvLoaderConfig(getSection(configYaml, 'GremlinCsvLoader')),
        Neptune: getNeptuneConfig(getSection(configYaml, 'Neptune')),
        NeptuneExporter: getNeptuneExporterTaskConfig(getSection(configYaml, 'NeptuneExporter')),
        NeptuneNotebook: getNeptuneNotebookConfig(getSection(configYaml, 'NeptuneNotebook')),
        NeptuneNotebookEfs: getNeptuneNotebookEfsConfig(getSection(configYaml, 'NeptuneNotebookEfs')),
        Tweets: getTweetsConfig(getSection(configYaml, 'Tweets')),
        TweetsGremlinCsvConverter: getTweetsGremlinCsvConverterConfig(getSection(configYaml, 'TweetsGremlinCsvConverter')),
        TweetsProducer: getTweetsProducerConfig(getSection(configYaml, 'TweetsProducer')),
        TwitterApi: getTwitterApiConfig(getSection(configYaml, 'TwitterApi')),
        Vpc: getVpcConfig(getSection(configYaml, 'Vpc')),
        WikimediaEvents: getWikimediaEventsConfig(getSection(configYaml, 'WikimediaEvents')),
        WikimediaEventsProducer: getWikimediaEventsProducerConfig(getSection(configYaml, 'WikimediaEventsProducer'))
    };

    return config;
}