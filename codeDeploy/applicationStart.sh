#!/bin/bash

cd /home/ubuntu/webapp
pwd
ls
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/webapp/amazon-cloudwatch-agent.json -s
pm2 start api.js