FROM php:8.2-apache

RUN a2enmod rewrite
RUN docker-php-ext-install session

COPY php.ini /usr/local/etc/php/conf.d/custom.ini

RUN mkdir -p /var/lib/php/sessions \
    && chown -R www-data:www-data /var/lib/php/sessions \
    && chmod 700 /var/lib/php/sessions

COPY . /var/www/html
