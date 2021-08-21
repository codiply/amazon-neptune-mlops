import os

from aws_xray_sdk.core import patch_all

patch_all(double_patch=True)


def main(event, context):
    try:    
        print(event)

    except Exception as e:
        print(e)
        raise e