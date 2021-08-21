import base64

def main(event, context):
    output = []
    for record in event['records']:
        payload = base64.b64decode(record['data'])
        payload = payload + b"\n"
        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(payload)
        }
        output.append(output_record)

    return { 'records': output }