FROM php:8.2-apache

# Attiva moduli proxy + rewrite
RUN a2enmod rewrite proxy proxy_http

# Attiva estensione PHP session
RUN docker-php-ext-install session

# Config PHP custom (se lo usi)
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Permessi sessioni
RUN mkdir -p /var/lib/php/sessions \
    && chown -R www-data:www-data /var/lib/php/sessions \
    && chmod 700 /var/lib/php/sessions

# Copia tutti i file nel container
COPY . /var/www/html
