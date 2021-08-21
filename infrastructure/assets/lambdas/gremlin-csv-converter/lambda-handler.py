import os
import boto3
import json

from urllib.parse import unquote
from aws_xray_sdk.core import patch_all

patch_all(double_patch=True)

loader_queue_url = os.environ('LOADER_QUEUE_URL')
s3_bucket = os.environ('S3_BUCKET')
input_path = os.environ('INPUT_PATH')
output_path = os.environ('OUTPUT_PATH')

s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')

def main(event, context):
    try:    
        keys = map(lambda x: unquote(x['s3']['object']['key']), event['Records'])
        keys = filter(lambda x: x.startswith(input_path), keys)

    except Exception as e:
        print(e)
        raise e