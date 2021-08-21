import os
import json
import logging
import re

import boto3
from sseclient import SSEClient as EventSource

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

firehose_client = boto3.client('firehose')

wikimedia_events_url = 'https://stream.wikimedia.org/v2/stream/recentchange'
delivery_stream_name = os.getenv('DELIVERY_STREAM_NAME')
wiki_regex = re.compile(os.getenv('WIKI_REGEX'))

def main():
    for event in EventSource(wikimedia_events_url):
        if event.event == 'message':
            try:
                data = json.loads(event.data)
                wiki = data['wiki']
            except ValueError:
                pass
            else:
                if wiki_regex.match(wiki):
                    firehose_client.put_record(
                        DeliveryStreamName=delivery_stream_name, 
                        Record={
                            'Data': event.data.encode('utf-8')
                        })


if __name__ == "__main__":
    main()