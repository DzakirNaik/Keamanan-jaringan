FROM php:8.2-apache

# Ekstensi PDO MySQL yang dipakai api.php / config.php
RUN docker-php-ext-install pdo_mysql

COPY . /var/www/html/

EXPOSE 80
