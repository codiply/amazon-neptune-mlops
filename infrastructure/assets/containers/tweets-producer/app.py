import os
import json
import logging
import sys

import boto3
import tweepy

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

ssm_client = boto3.client('ssm')
firehose_client = boto3.client('firehose')

consumer_key = ssm_client.get_parameter(
	Name=os.getenv('TWITTER_API_CONSUMER_KEY_SSM_PARAMETER'),
  WithDecryption=True)['Parameter']['Value']
consumer_secret = ssm_client.get_parameter(
	Name=os.getenv('TWITTER_API_CONSUMER_SECRET_SSM_PARAMETER'),
  WithDecryption=True)['Parameter']['Value']
access_token = ssm_client.get_parameter(
    Name=os.getenv('TWITTER_API_ACCESS_TOKEN_SSM_PARAMETER'),
    WithDecryption=True)['Parameter']['Value']
access_token_secret = ssm_client.get_parameter(
    Name=os.getenv('TWITTER_API_ACCESS_TOKEN_SECRET_SSM_PARAMETER'),
    WithDecryption=True)['Parameter']['Value']

tweets_filter = os.getenv('TWEETS_FILTER')
delivery_stream_name = os.getenv('DELIVERY_STREAM_NAME')

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)


class TweetsProducer(tweepy.StreamListener):
    def __init__(self, firehose_client):
        self.firehose_client = firehose_client

    def on_data(self, data):
        tweet = json.loads(data)
        self.firehose_client.put_record(
            DeliveryStreamName=delivery_stream_name, 
            Record={
                'Data':json.dumps(tweet).encode('utf-8')
            }
        )
        return True
    
    def on_error(self, status):
        logging.error(str(status))

if __name__ == "__main__":
    tweets_producer = TweetsProducer(firehose_client)
    stream = tweepy.Stream(auth=auth, listener=tweets_producer)
    stream.filter(track=[tweets_filter])
