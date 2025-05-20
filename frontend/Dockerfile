FROM php:8.2-apache

# Attiva moduli proxy + rewrite
RUN a2enmod rewrite proxy proxy_http

# Attiva estensione PHP session
RUN docker-php-ext-install session

# Config PHP custom (se lo usi)
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Permessi sessioni

RUN mkdir -p /tmp/php-sessions
RUN chown -R 33:33 /tmp/php-sessions  # 33 = www-data
RUN chmod -R 700 /tmp/php-sessions

# Copia tutti i file nel container
COPY . /var/www/html
