import os
import json
import logging
import sys

import boto3
import requests

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

sqs_queue_url = os.getenv('SQS_QUEUE_URL')
database_endpoint_host = os.getenv('DATABASE_ENDPOINT_HOST')
database_endpoint_port = os.getenv('DATABASE_ENDPOINT_PORT')
loader_role_arn = os.getenv("LOADER_ROLE_ARN")
aws_region = os.getenv("AWS_REGION")

loader_endpoint = "https://{}:{}/loader".format(database_endpoint_host, database_endpoint_port)

sqs_client = boto3.client('sqs')

def main():
    while True:
        try: 
            receive_message_response = sqs_message = sqs_client.receive_message(
                QueueUrl=sqs_queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20)
            if 'Messages' in receive_message_response:
                for message in receive_message_response['Messages']:
                    process_message(message)
        except:
            logging.exception('')
        

def process_message(message):
    try: 
        receipt_handle = message['ReceiptHandle']
        message_body = json.loads(message['Body'])
        vertex_files = message_body['vertex_files'] if 'vertex_files' in message_body else []
        edge_files = message_body['edge_files'] if 'edge_files' in message_body else []

        if not vertex_files and not edge_files:
            raise Exception("The message contained neither vertex nor edge files!")

        vertex_load_ids = request_to_load(vertex_files, load_id_dependencies=[])
        _ = request_to_load(edge_files, load_id_dependencies=vertex_load_ids)
    except:
        logging.exception('')
    else:
        sqs_client.delete_message(QueueUrl=sqs_queue_url, ReceiptHandle=receipt_handle)


def request_to_load(s3_files, load_id_dependencies):
    load_ids = []

    for source in s3_files:
        request = {
            "source": source,
            "format": "csv",
            "iamRoleArn": loader_role_arn,
            "region": aws_region,
            "failOnError": "FALSE",
            "queueRequest": "TRUE",
            "dependencies": load_id_dependencies,
            "updateSingleCardinalityProperties": "TRUE" 
        }

        response = requests.post(loader_endpoint, json=request, timeout=30)
        response.raise_for_status()
        
        load_id = response.json()['payload']['loadId']
        load_ids.append(load_id)
        logging.info("Queued file {} with load id {}".format(source, load_id))

    return load_ids

if __name__ == "__main__":
    main()
