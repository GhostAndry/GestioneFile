#!/usr/bin/bash

sudo mkdir -p /tmp/php-sessions
sudo chown -R 33:33 /tmp/php-sessions  # 33 = www-data
sudo chmod -R 700 /tmp/php-sessions
