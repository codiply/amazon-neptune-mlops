import os
import json

import boto3
import tweepy

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

tweet_filter = os.getenv('TWEET_FILTER')
delivery_stream_name = os.getenv('DELIVERY_STREAM_NAME')

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)


class TweetProducer(tweepy.StreamListener):
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
        print("Error: " + str(status))

if __name__ == "__main__":
    tweet_producer = TweetProducer(firehose_client)
    stream = tweepy.Stream(auth=auth, listener=tweet_producer)
    stream.filter(track=[tweet_filter])
