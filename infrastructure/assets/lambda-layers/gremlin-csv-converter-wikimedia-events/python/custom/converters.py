import uuid

def get_user_vertex_id(event):
    if 'user' in event:
        return "user:{}".format(event['user'])
    
def get_title_vertex_id(event):
    if 'title' in event:
        return "title:{}".format(event['title'])

class UserVertexConverter(object):
    def header(self):
        return "~id, ~label"
    def convert(self, event):
        user_vertex_id = get_user_vertex_id(event)
        if user_vertex_id:
            return [ 
                "\"{}\",user".format(user_vertex_id)
            ]
    
class TitleVertexConverter(object):
    def header(self):
        return "~id, ~label"
    def convert(self, event):
        title_vertex_id = get_title_vertex_id(event)
        if title_vertex_id:
            return [
                "\"{}\",title".format(title_vertex_id)
            ]
    
class InteractionEdgeConverter(object):
    def header(self):
        return "~id, ~from, ~to, ~label"
    def convert(self, event):
        if 'type' in event:
            user_vertex_id = get_user_vertex_id(event)
            title_vertex_id = get_title_vertex_id(event)
            if user_vertex_id and title_vertex_id:
                return [
                    "\"{}\",\"{}\",\"{}\",\"{}\"".format(
                        str(uuid.uuid4()),
                        user_vertex_id,
                        title_vertex_id,
                        event['type'])
                ]

class GremlinCsvConverters(object):
    user_vertex_converter = UserVertexConverter()
    title_vertex_converter = TitleVertexConverter()
    interaction_edge_converter = InteractionEdgeConverter()
    
    def to_vertexes(self):
        return [
            ('user', self.user_vertex_converter),
            ('title', self.title_vertex_converter)
        ]
        
    def to_edges(self):
        return [
            ('interaction', self.interaction_edge_converter)
        ]