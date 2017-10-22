FROM alpine:3.4


ENV \
PHP_VERSION="7.1.10" \
PHP_RELEASE_URL="http://php.net/get/php-7.1.10.tar.gz/from/this/mirror" \
PHP_INI_DIR="/etc/php" \
LIBICONV_VERSION="1.14" \
LD_PRELOAD="/usr/local/lib/preloadable_libiconv.so" \
PHPIZE_DEPS="autoconf file g++ gcc libc-dev make pkgconf re2c" \
APP_ROOT_DIR="/data" \
APP_WWW_DIR="www" \
NGINX_VERSION="1.10.2" \
DATA_DIR="/data" \
WWW_DIR="/data/www"

COPY root /


### TEMPLATE: common/symlink_lib64.j2
RUN set -x && \
# create symlink for lib64
# some libraries are by default installed to */lib64 and pkg-config can not find them (on Alpine distro)
ln -s /usr/lib /usr/lib64 && \
ln -s /usr/local/lib /usr/local/lib64

### TEMPLATE: php/create_dirs.j2
RUN set -x && \
# create required dirs
mkdir -p /usr/src

### TEMPLATE: apk/install_persistent_deps.j2
RUN set -x && \
### install persistent dependencies
apk add --no-cache --virtual .persistent-deps \
tar \
nodejs \
libxml2 \
sed \
curl \
pcre \
git \
nano \
s6 \
postgresql-libs \
libpng \
libssl1.0 \
gmp \
freetype \
cyrus-sasl \
ncurses-libs \
ca-certificates \
libcrypto1.0 \
icu-libs \
libedit \
libjpeg-turbo \
zlib \
openssl \
sqlite-libs

### TEMPLATE: apk/install_build_deps.j2
RUN set -x && \
### install build dependencies
apk add --no-cache --virtual .build-deps \
zlib-dev \
freetype-dev \
libjpeg-turbo-dev \
gmp-dev \
icu-dev \
gcc \
cmake \
openssl-dev \
sqlite-dev \
perl-dev \
postgresql-dev \
unzip \
curl-dev \
pcre-dev \
libedit-dev \
libtool \
wget \
linux-headers \
libxml2-dev \
paxmark \
luajit-dev \
libpng-dev \
cyrus-sasl-dev \
libc-dev \
build-base \
autoconf

### TEMPLATE: apk/install_phpize_deps.j2
RUN set -x && \
### install phpize dependencies
apk add --no-cache --virtual .phpize-deps $PHPIZE_DEPS

### TEMPLATE: dependencies/libiconv.j2
RUN set -x && \
# download and compile iconv
rm -f /usr/bin/iconv && \
curl -SL http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz | tar -xz -C /usr/src && \
cd /usr/src/libiconv-1.14 && \
cd srclib && \
# fix libiconv issue: 'gets' function was removed from compiler
grep -v "_GL_WARN_ON_USE (gets" stdio.in.h > stdio.in.h.new && mv stdio.in.h.new stdio.in.h && \
cd .. && \
./configure --prefix=/usr/local && \
make && \
make install && \
cd .. && \
rm -R /usr/src/libiconv-1.14

### TEMPLATE: common/create_user.j2
RUN set -x && \
# ensure www-data user exists
# 82 is the standard uid/gid for "www-data" in Alpine
# http://git.alpinelinux.org/cgit/aports/tree/main/apache2/apache2.pre-install?h=v3.3.2
# http://git.alpinelinux.org/cgit/aports/tree/main/lighttpd/lighttpd.pre-install?h=v3.3.2
# http://git.alpinelinux.org/cgit/aports/tree/main/nginx-initscripts/nginx-initscripts.pre-install?h=v3.3.2
if ! grep -q www-data /etc/group; then addgroup -g 82 -S www-data; fi && \
if ! id -u www-data; then adduser -u 82 -D -S -G www-data www-data; fi

### TEMPLATE: php/source_extract.j2
RUN set -x && \
docker-php-source extract

### TEMPLATE: php/compile.j2
RUN set -x && \
mkdir -p "$PHP_INI_DIR/conf.d" && \
cd /usr/src/php && \
./configure \
--disable-cgi \
--disable-debug \
--disable-phpdbg-debug \
--with-config-file-path="$PHP_INI_DIR" \
--with-config-file-scan-dir="$PHP_INI_DIR/conf.d" \
--enable-ftp \
--enable-mbstring \
--enable-mysqlnd \
--with-curl \
--with-libedit \
--with-openssl \
--with-zlib \
--with-iconv \
--with-iconv-dir=/usr/local \
--disable-phpdbg \
--enable-cli \
--enable-fpm \
--with-fpm-user=www-data \
--with-fpm-group=www-data && \
make -j"$(getconf _NPROCESSORS_ONLN)" && \
make install

### TEMPLATE: php/source_delete.j2
RUN set -x && \
docker-php-source delete

### TEMPLATE: dependencies/librabbitmq.j2
RUN set -x && \
# download and compile amqplib
mkdir -p /usr/src/rabbitmq-c && \
curl -SL "https://github.com/alanxz/rabbitmq-c/archive/master.tar.gz" | tar -xz -C /usr/src/rabbitmq-c --strip-components=1 && \
cd /usr/src/rabbitmq-c && \
mkdir build && cd build && \
cmake -DCMAKE_INSTALL_PREFIX=/usr .. && \
cmake --build . --target install && \
cd .. && \
rm -R /usr/src/rabbitmq-c

### TEMPLATE: php/extensions.j2
RUN set -x && \
# install core extensions
docker-php-ext-install \
bcmath \
gd \
exif \
pdo_mysql \
pdo_pgsql \
pdo_sqlite \
zip \
intl \
gmp \
sockets \
opcache && \
# install PECL extensions
pecl install \
mongodb-1.3.1 \
amqp-1.9.3 \
redis-3.1.4 && \
docker-php-ext-enable \
mongodb \
amqp \
redis

### TEMPLATE: tools/composer.j2
RUN set -x && \
# composer installation
cd ~ && \
curl -sS https://getcomposer.org/installer | HTTP_PROXY="" php && \
mv -v composer.phar /usr/local/bin/composer

### TEMPLATE: nodejs/packages.j2
RUN set -x && \
### NodeJs packages
HTTP_PROXY="" npm install -g \
less

### TEMPLATE: webserver/nginx.j2
RUN set -x && \
mkdir /usr/src/nginx && \
curl -SL "http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" | tar -xz -C /usr/src/nginx --strip-components=1 && \
mkdir /usr/src/nginx_upload_progress_module && \
curl -SL "https://github.com/masterzen/nginx-upload-progress-module/tarball/v0.9.2" | tar -xz -C /usr/src/nginx_upload_progress_module --strip-components=1 && \
cd /usr/src/nginx && \
./configure \
--prefix=/usr/local \
--conf-path=/etc/nginx/nginx.conf \
--pid-path=/run/nginx/nginx.pid \
--lock-path=/run/nginx/nginx.lock \
--user=www-data \
--group=www-data \
--with-ipv6 \
--with-file-aio \
--with-pcre-jit \
--with-http_dav_module \
--with-http_ssl_module \
--with-http_stub_status_module \
--with-http_gzip_static_module \
--with-http_v2_module \
--with-http_auth_request_module \
--add-module=/usr/src/nginx_upload_progress_module && \
make && \
make install && \
cd .. && \
rm -R /etc/nginx/* && \
rm -R /usr/src/nginx && \
rm -R /usr/src/nginx_upload_progress_module && \
mkdir -p /run/nginx /etc/nginx/conf.d

### TEMPLATE: tools/go_envtpl.j2
RUN set -x && \
# builld Go version of Envtpl used for configuration templates by entrypoint
if ! which go; then \
  apk add --no-cache go && \
  export GO_ENVTPL_BUILD_REMOVE_GO="true"; \
fi && \
if ! which git; then \
  apk add --no-cache git && \
  export GO_ENVTPL_BUILD_REMOVE_GIT="true"; \
fi && \
export GOPATH="/usr" && \
if ! which glide; then \
  curl https://glide.sh/get | sh && \
  export GO_ENVTPL_BUILD_REMOVE_GLIDE="true"; \
fi && \
mkdir /usr/src/envtpl && \
curl -SL "https://github.com/arschles/envtpl/archive/master.tar.gz" | tar -xz -C /usr/src/envtpl --strip-components=1 && \
cd /usr/src/envtpl && \
glide up && \
go build -a -o envtpl && \
mv envtpl /usr/local/bin/envtpl && \
chmod +x /usr/local/bin/envtpl && \
rm -R /usr/src/envtpl && \
if [ "$GO_ENVTPL_BUILD_REMOVE_GO" == "true" ]; then \
  apk del go; \
fi && \
if [ "$GO_ENVTPL_BUILD_REMOVE_GIT" == "true" ]; then \
  apk del git; \
fi && \
if [ "$GO_ENVTPL_BUILD_REMOVE_GLIDE" == "true" ]; then \
  rm "$(which glide)"; \
fi && \
cd ~

### TEMPLATE: php/source_delete_archive.j2
RUN set -x && \
docker-php-source delete-archive

### TEMPLATE: common/strip.j2
RUN set -x && \
### reduce the size of binary files using 'strip' command
{ find /usr/local/bin /usr/local/sbin -type f -perm +0111 -exec strip -p --strip-all '{}' + || true; }

### TEMPLATE: apk/remove_phpize_deps.j2
RUN set -x && \
### remove phpize dependencies
apk del --purge .phpize-deps

### TEMPLATE: apk/remove_build_deps.j2
RUN set -x && \
### remove build dependencies
apk del --purge .build-deps

### TEMPLATE: common/cleanup.j2
RUN set -x && \
rm -rf \
/usr/src \
/usr/include \
/usr/local/src \
/usr/local/php \
/usr/local/man \
/usr/local/share/man \
/usr/local/include/iconv.h \
/usr/local/include/libcharset.h \
/usr/local/include/localcharset.h \
/usr/share/man \
/usr/local/share/doc \
/usr/share/doc \
/usr/lib/gcc \
/usr/local/lib/php/doc  \
/usr/local/lib/php/test \
/usr/local/share/doc \
/usr/local/lib/php/test \
/usr/local/lib/php/doc \
/var/cache \
/root \
/tmp && \
mkdir -p \
/usr/src \
/usr/include \
/var/cache/apk \
/root \
/tmp && \
chmod 777 -R /tmp






VOLUME ["/etc/nginx/conf.d"]
EXPOSE 80


WORKDIR $DATA_DIR

ENTRYPOINT ["/entrypoint.sh"]

CMD ["run"]
