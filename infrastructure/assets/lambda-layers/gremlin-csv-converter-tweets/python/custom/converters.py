import os
from benedict import benedict
from datetime import datetime, time

allowed_languages = list(map(lambda x: x.lower(), os.environ['ALLOWED_LANGUAGES'].split(",")))

def is_ascii_text(text):
    try:
        text.encode(encoding='utf-8').decode('ascii')
    except UnicodeDecodeError:
        return False
    else:
        return True

def get_user_vertex_id_from_screen_name(screen_name):
    return "user:{}".format(screen_name.lower())
    
def get_tweet_vertex_id_from_tweet_id(id_str):
    return "tweet:{}".format(id_str)

def get_hashtag_vertex_id_from_hashtag_text(text):
    return "hashtag:{}".format(text.lower())

def get_user_screen_name(event):
    if 'user.screen_name' in event and event['user.screen_name']:
        return event['user.screen_name'] 

def get_user_vertex_id(event):
    screen_name=get_user_screen_name(event)
    if screen_name:
        return get_user_vertex_id_from_screen_name(screen_name)

def get_in_reply_to_screen_name(event):
    if 'in_reply_to_screen_name' in event and event['in_reply_to_screen_name']:
        return event['in_reply_to_screen_name']

def get_in_reply_to_user_vertex_id(event):
    screen_name=get_in_reply_to_screen_name(event)
    if screen_name:
        return get_user_vertex_id_from_screen_name(screen_name)

def get_original_post_screen_name(event):
    if ('retweeted_status' in event):
        return get_user_screen_name(event['retweeted_status'])
    
def get_original_post_user_vertex_id(event):
    screen_name=get_original_post_screen_name(event)
    if screen_name:
        return get_user_vertex_id_from_screen_name(screen_name)

def get_user_mentions_screen_names(event):
    if ('entities.user_mentions' in event and event['entities.user_mentions']):
        return list(map(lambda x: x['screen_name'], event['entities.user_mentions']))

def get_user_mentions_user_vertex_ids(event):
    screen_names=get_user_mentions_screen_names(event)
    if screen_names:
        return list(map(lambda x: get_user_vertex_id_from_screen_name(x), screen_names))

def get_hashtags_vertex_ids(event):
    if 'entities.hashtags' in event and event['entities.hashtags']:
        hastag_texts = filter(lambda x: is_ascii_text(x), map(lambda x: x['text'], event['entities.hashtags']))
        return list(map(lambda x: get_hashtag_vertex_id_from_hashtag_text(x), hastag_texts))
    
def get_tweet_vertex_id(event):
    if 'id_str' in event:
        return get_tweet_vertex_id_from_tweet_id(event['id_str'])

class UserVertexConverter(object):
    def header(self):
        return "~id, ~label, screen_name:String(single)"
    def convert(self, event):
        event = benedict(event)

        user_screen_name=get_user_screen_name(event)
        if user_screen_name:
            yield self._line_for_screen_name(user_screen_name)
        
        in_reply_to_screen_name=get_in_reply_to_screen_name(event)
        if in_reply_to_screen_name:
            yield self._line_for_screen_name(in_reply_to_screen_name)

        original_post_screen_name=get_original_post_screen_name(event)
        if original_post_screen_name:
            yield self._line_for_screen_name(original_post_screen_name)

        user_mentions_screen_names=get_user_mentions_screen_names(event)
        if user_mentions_screen_names:
            for screen_name in user_mentions_screen_names:
                yield self._line_for_screen_name(screen_name)
                
        if 'retweeted_status' in event:
            user_mentions_screen_names=get_user_mentions_screen_names(event['retweeted_status'])
            if user_mentions_screen_names:
                for screen_name in user_mentions_screen_names:
                    yield self._line_for_screen_name(screen_name)
        
    def _line_for_screen_name(self, screen_name):
        return "\"{vertex_id}\",user,\"{screen_name}\"".format(
                    vertex_id=get_user_vertex_id_from_screen_name(screen_name),
                    screen_name=screen_name)
        
    
class TweetVertexConverter(object):
    def header(self):
        return "~id,~label,text:String(single),timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'id_str' in event:
            yield self._line_for_tweet(event)
        if 'retweeted_status.id_str' in event:
            yield self._line_for_tweet(event['retweeted_status'])
    def _clean_text(self, text):
        return text.replace("\n", " ").replace('"',"'")
    def _line_for_tweet(self, event):
        clean_text = self._clean_text(event['text'])
        timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
        return "\"{vertex_id}\",tweet,\"{text}\",{timestamp}".format(
                vertex_id=get_tweet_vertex_id_from_tweet_id(event['id_str']),
                text=clean_text,
                timestamp=timestamp)


class HashtagVertexConverter(object):
    def header(self):
        return "~id, ~label, text:String(single)"
    def convert(self, event):
        event = benedict(event)
        yield from self._convert_event(event)
        if 'retweeted_status' in event:
            yield from self._convert_event(event['retweeted_status'])
    def _convert_event(self, event):
        if 'entities.hashtags' in event and event['entities.hashtags']:
            for tag in event['entities.hashtags']:
                hashtag_text = tag['text']
                if is_ascii_text(hashtag_text):
                    yield self._line_for_hashtag(hashtag_text)
    def _line_for_hashtag(self, text):
        return "\"{vertex_id}\",hashtag,\"{text}\"".format(
                vertex_id=get_hashtag_vertex_id_from_hashtag_text(text),
                text=text)
    
class TweetEdgeConverter(object):
    def header(self):
        return "~id,~from,~to,~label,timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'retweeted_status' in event:
            event = event['retweeted_status']
        timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
        user_vertex_id = get_user_vertex_id(event)
        tweet_vertex_id = get_tweet_vertex_id(event)
        if user_vertex_id and tweet_vertex_id:
            yield self._line_for_edge(user_vertex_id, tweet_vertex_id, timestamp)
            
    def _line_for_edge(self, user_vertex_id, tweet_vertex_id, timestamp):
        return "\"{edge_id}\",\"{user_vertex_id}\",\"{tweet_vertex_id}\",tweet,{timestamp}".format(
                    edge_id="tweet:{}:{}".format(user_vertex_id, tweet_vertex_id),
                    user_vertex_id=user_vertex_id,
                    tweet_vertex_id=tweet_vertex_id,
                    timestamp=timestamp)

class RetweetEdgeConverter(object):
    def header(self):
        return "~id,~from,~to,~label,timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'retweeted_status' in event:
            timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
            user_vertex_id = get_user_vertex_id(event)
            tweet_vertex_id = get_tweet_vertex_id(event['retweeted_status'])
            if user_vertex_id and tweet_vertex_id:
                return [
                    "\"{edge_id}\",\"{user_vertex_id}\",\"{tweet_vertex_id}\",retweet,{timestamp}".format(
                        edge_id="retweet:{}:{}".format(user_vertex_id, tweet_vertex_id),
                        user_vertex_id=user_vertex_id,
                        tweet_vertex_id=tweet_vertex_id,
                        timestamp=timestamp)
                ]

            
class MentionEdgeConverter(object):
    def header(self):
        return "~id,~from,~to,~label,timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'retweeted_status' in event:
            event = event['retweeted_status']
        timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
        tweet_vertex_id = get_tweet_vertex_id(event)
        user_vertex_ids = get_user_mentions_user_vertex_ids(event)
        if tweet_vertex_id and user_vertex_ids:
            for user_vertex_id in user_vertex_ids:
                yield self._line_for_edge(tweet_vertex_id, user_vertex_id, timestamp)
            
    def _line_for_edge(self, tweet_vertex_id, user_vertex_id,timestamp):
        return "\"{edge_id}\",\"{tweet_vertex_id}\",\"{user_vertex_id}\",mention,{timestamp}".format(
                    edge_id="mention:{}:{}".format(tweet_vertex_id, user_vertex_id),
                    tweet_vertex_id=tweet_vertex_id,  
                    user_vertex_id=user_vertex_id,
                    timestamp=timestamp)
    

class TagEdgeConverter(object):
    def header(self):
        return "~id,~from,~to,~label,timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'retweeted_status' in event:
            event = event['retweeted_status']
        timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
        tweet_vertex_id = get_tweet_vertex_id(event)
        hashtag_vertex_ids = get_hashtags_vertex_ids(event)
        if tweet_vertex_id and hashtag_vertex_ids:
            for hashtag_vertex_id in hashtag_vertex_ids:
                yield self._line_for_edge(tweet_vertex_id, hashtag_vertex_id, timestamp)
            
    def _line_for_edge(self, tweet_vertex_id, hashtag_vertex_id, timestamp):
        return "\"{edge_id}\",\"{tweet_vertex_id}\",\"{hashtag_vertex_id}\",tag,{timestamp}".format(
                    edge_id="tag:{}:{}".format(tweet_vertex_id, hashtag_vertex_id),
                    tweet_vertex_id=tweet_vertex_id,  
                    hashtag_vertex_id=hashtag_vertex_id,
                    timestamp=timestamp)
    

class ReplyEdgeConverter(object):
    def header(self):
        return "~id,~from,~to,~label,timestamp:Long(single)"
    def convert(self, event):
        event = benedict(event)
        if 'retweeted_status' in event:
            event = event['retweeted_status']
        timestamp = int(datetime.strptime(event['created_at'], "%a %b %d %H:%M:%S %z %Y").timestamp())
        tweet_vertex_id = get_tweet_vertex_id(event)
        reply_to_user_vertex_id = get_in_reply_to_user_vertex_id(event)
        if tweet_vertex_id and reply_to_user_vertex_id:
            yield self._line_for_edge(tweet_vertex_id, reply_to_user_vertex_id, timestamp)
            
    def _line_for_edge(self, tweet_vertex_id, user_vertex_id, timestamp):
        return "\"{edge_id}\",\"{tweet_vertex_id}\",\"{user_vertex_id}\",reply,{timestamp}".format(
                    edge_id="reply:{}:{}".format(tweet_vertex_id, user_vertex_id),
                    tweet_vertex_id=tweet_vertex_id,  
                    user_vertex_id=user_vertex_id,
                    timestamp=timestamp)

    
    
class GremlinCsvConverters(object):
    user_vertex_converter = UserVertexConverter()
    tweet_vertex_converter = TweetVertexConverter()
    hashtag_vertex_converter = HashtagVertexConverter()
    tweet_edge_converter = TweetEdgeConverter()
    retweet_edge_converter = RetweetEdgeConverter()
    mention_edge_converter = MentionEdgeConverter()
    tag_edge_converter = TagEdgeConverter()
    reply_edge_converter = ReplyEdgeConverter()
    
    def drop_event(self, event):
        return not('lang' in event and event['lang'].lower() in allowed_languages)

    def to_vertexes(self):
        return [
            ('user', self.user_vertex_converter),
            ('tweet', self.tweet_vertex_converter),
            ('hashtag', self.hashtag_vertex_converter)
        ]
        
    def to_edges(self):
        return [
            ('tweet', self.tweet_edge_converter),
            ('retweet', self.retweet_edge_converter),
            ('mention', self.mention_edge_converter),
            ('tag', self.tag_edge_converter),
            ('reply', self.reply_edge_converter)
        ]
