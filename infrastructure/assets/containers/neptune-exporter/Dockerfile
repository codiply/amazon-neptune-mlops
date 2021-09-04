FROM public.ecr.aws/amazonlinux/amazonlinux:2.0.20210721.2

RUN yum update -y && yum install -y \
      java-1.8.0-openjdk \
      wget \
      && yum clean all && rm -rf /var/cache/yum

WORKDIR /opt/exporter
RUN mkdir /opt/exporter/root-path

RUN wget https://s3.amazonaws.com/aws-neptune-customer-samples/neptune-export/bin/neptune-export.jar

CMD java -jar /opt/exporter/neptune-export.jar nesvc \
    --root-path /opt/exporter/root-path \
    --json \
    "{\"params\":{\"endpoint\":\"$DATABASE_ENDPOINT_HOST\",\"profile\" : \"neptune_ml\"},\"outputS3Path\":\"$OUTPUT_S3_PATH\"}"