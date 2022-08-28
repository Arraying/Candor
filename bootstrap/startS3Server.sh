#!/bin/bash
docker run -d --name s3server \
  -v $(pwd)/cloudserver_config.json:/usr/src/app/config.json \
  -e S3DATA=multiple \
  -e S3BACKEND=file \
  -e SCALITY_ACCESS_KEY_ID=username \
  -e SCALITY_SECRET_ACCESS_KEY=password \
  -p 9000:8000 \
  zenko/cloudserver
