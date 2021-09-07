import os
import boto3
import json

from urllib.parse import unquote
from aws_xray_sdk.core import patch_all
from custom.converters import GremlinCsvConverters

patch_all(double_patch=True)

loader_queue_url = os.getenv('LOADER_QUEUE_URL')
s3_bucket = os.getenv('S3_BUCKET')
input_path = os.getenv('INPUT_PATH')
output_path = os.getenv('OUTPUT_PATH')

s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')

gremlin_csv_converters = GremlinCsvConverters()

def main(event, context):
    try:    
        keys = map(lambda x: unquote(x['s3']['object']['key']), event['Records'])
        keys = list(filter(lambda x: x.startswith(input_path), keys))

        for key in keys:
            process_file(key)

    except Exception as e:
        print(e)
        raise e

def process_content_with_converter(content_json, converter_type, converter_name, converter, drop_event, original_key_suffix):
    output_key = "{}{}-{}-{}".format(output_path, original_key_suffix, converter_type, converter_name)
    converted_lines = [converter.header()]
    for line in content_json:
        try:
            if not drop_event(line):
                new_lines = converter.convert(line)
                if new_lines:
                    for line in new_lines:
                        converted_lines.append(line)
        except Exception as e:
            print('Error: {}'.format(e))
    converted_content = "\n".join(converted_lines)
    s3_client.put_object(Body=converted_content.encode('utf-8'), Bucket=s3_bucket, Key=output_key)
    return output_key

def process_file(key):
    original_key_suffix = key[len(input_path):-1]
    content = s3_client.get_object(Bucket=s3_bucket, Key=key)['Body'].read().decode('utf-8')
    content_json = list(map(lambda x: json.loads(x), content.splitlines()))
    vertex_keys = []
    edge_keys = []
    for (converter_name, converter) in gremlin_csv_converters.to_vertexes():
        output_key = process_content_with_converter(content_json, 'vertexes', converter_name, converter, gremlin_csv_converters.drop_event, original_key_suffix)
        vertex_keys.append(output_key)
    for (converter_name, converter) in gremlin_csv_converters.to_edges():
        output_key = process_content_with_converter(content_json, 'edges', converter_name, converter, gremlin_csv_converters.drop_event, original_key_suffix)
        vertex_keys.append(output_key)
    loader_message = {
        "vertex_files": list(map(lambda x: "s3://{}/{}".format(s3_bucket, x), vertex_keys)),
        "edge_files": list(map(lambda x: "s3://{}/{}".format(s3_bucket, x), edge_keys))
    }
    sqs_client.send_message(
        QueueUrl=loader_queue_url,
        MessageBody=json.dumps(loader_message)
    )
