import uuid

def get_user_vertex_id_from_screen_name(screen_name):
    return "user:{}".format(screen_name.lower())
    
def get_tweet_vertex_id_from_tweet_id(id_str):
    return "tweet:{}".format(id_str)

def get_user_screen_name(event):
    if 'user' in event and 'screen_name' in event['user'] and event['user']['screen_name']:
        return event['user']['screen_name'] 

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
    if ('retweeted_status' in event
         and 'user' in event['retweeted_status']
         and event['retweeted_status']['user'] 
         and event['retweeted_status']['user']['screen_name']):
        return event['retweeted_status']['user']['screen_name']
    
def get_original_post_user_vertex_id(event):
    screen_name=get_original_post_screen_name(event)
    if screen_name:
        return get_user_vertex_id_from_screen_name(screen_name)

def get_user_mentions_screen_names(event):
    if ('entities' in event 
        and 'user_mentions' in event['entities']
        and event['entities']['user_mentions']):
        return list(map(lambda x: x['screen_name'], event['entities']['user_mentions']))

def get_user_mentions_user_vertex_ids(event):
    screen_names=get_user_mentions_screen_names(event)
    if screen_names:
        return list(map(lambda x: get_user_vertex_id_from_screen_name(x), screen_names))

def get_tweet_vertex_id(event):
    if 'id_str' in event:
        return get_tweet_vertex_id_from_tweet_id(event['id_str'])

class UserVertexConverter(object):
    def header(self):
        return "~id, ~label, screen_name:String"
    def convert(self, event):
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
        
    def _line_for_screen_name(self, screen_name):
        return "\"{vertex_id}\",user,\"{screen_name}\"".format(
                    vertex_id=get_user_vertex_id_from_screen_name(screen_name),
                    screen_name=screen_name)
        
    
class TweetVertexConverter(object):
    def header(self):
        return "~id, ~label, text:String"
    def convert(self, event):
        if 'id_str' in event:
            yield self._line_for_tweet(id_str=event['id_str'], text=event['text'])
        if ('retweeted_status' in event
            and 'id_str' in event['retweeted_status']):
            yield self._line_for_tweet(
                id_str=event['retweeted_status']['id_str'], 
                text=event['retweeted_status']['text'])
    def _line_for_tweet(self, id_str, text):
        return "\"{vertex_id}\",tweet,\"{text}\"".format(
                vertex_id=get_tweet_vertex_id_from_tweet_id(id_str),
                text=text)
    
class TweetEdgeConverter(object):
    def header(self):
        return "~id, ~from, ~to, ~label, timestamp_ms:Long"
    def convert(self, event):
        user_vertex_id = get_user_vertex_id(event)
        tweet_vertex_id = get_tweet_vertex_id(event)
        if user_vertex_id and tweet_vertex_id:
            return [
                "\"{edge_id}\",\"{user_vertex_id}\",\"{tweet_vertex_id}\",tweet,{timestamp_ms}".format(
                    edge_id=str(uuid.uuid4()),
                    user_vertex_id=user_vertex_id,
                    tweet_vertex_id=tweet_vertex_id,
                    timestamp_ms=event['timestamp_ms'])
            ]

class GremlinCsvConverters(object):
    user_vertex_converter = UserVertexConverter()
    tweet_vertex_converter = TweetVertexConverter()
    tweet_edge_converter = TweetEdgeConverter()
    
    def to_vertexes(self):
        return [
            ('user', self.user_vertex_converter),
            ('tweet', self.tweet_vertex_converter)
        ]
        
    def to_edges(self):
        return [
            ('tweet', self.tweet_edge_converter)
        ]