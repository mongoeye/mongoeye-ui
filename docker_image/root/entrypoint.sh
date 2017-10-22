#!/bin/sh

# Exit if any subcommand or pipeline returns a non-zero status
set -e

# Export all environment variables (for envtpl)
set -a

cmd="$@"
LOG_TIME="${LOG_TIME:-true}"

#### Functions #################################################################
template () {
    log "creating $1 "
    mkdir -p `dirname "$1"`
    envtpl -in "$2" > "$1"
    if [ "$3" = 'executable' ]; then
        chmod +x "$1"
    fi
}

log () {
  tag="entrypoint"
  if [ "$LOG_TIME" = 'true' ]; then
    echo $1 | awk "{ print strftime(\"%Y-%m-%d %H:%M:%S\"), \"$tag:\", \$0; fflush(); }"
  else
    echo $1 |  awk "{ print \"$tag:\", \$0; fflush(); }"
  fi
}

quite_if_succ() {
  if ! output=$({ "$@"; } 2>&1); then
    echo "$output"
    echo "ERROR in execution $@, see above"
    if [ "$cmd" = 'run' ]; then
      exit 1
    fi
  fi
}

#### Configure PHP #############################################################
PHP_DEBUG_MODE="${PHP_DEBUG_MODE:-false}"
if $PHP_DEBUG_MODE; then
    log "PHP debug mode enabled (PHP_DEBUG_MODE variable is 'true')"

    PHP_DISPLAY_ERRORS='true'
    log "PHP debug mode: PHP_DISPLAY_ERRORS=true"

    PHP_DISPLAY_STARTUP_ERRORS='true'
    log "PHP debug mode: PHP_DISPLAY_STARTUP_ERRORS=true"

    PHP_OPCACHE_VALIDATE_TIMESTAMPS='true'
    log "PHP debug mode: PHP_OPCACHE_VALIDATE_TIMESTAMPS=true"

fi

NUMBER_OF_PROCESOR=`/bin/grep -c ^processor /proc/cpuinfo`
MAX_REQUEST_SIZE="${MAX_REQUEST_SIZE:-500M}"
WWW_DIR="${WWW_DIR:-/data/www}"

PHP_FPM_LOG_LEVEL="${PHP_FPM_LOG_LEVEL:-warning}"
PHP_FPM_ACCESS_LOG="${PHP_FPM_ACCESS_LOG:-/dev/null}"
PHP_FPM_ERROR_LOG="${PHP_FPM_ERROR_LOG:-/proc/self/fd/2}"
PHP_FPM_HOST="${PHP_FPM_HOST:-127.0.0.1}"
PHP_FPM_PORT="${PHP_FPM_PORT:-9000}"
PHP_FPM_USE_SOCKET="${PHP_FPM_USE_SOCKET:-false}"
PHP_FPM_SOCKET_PATH="${PHP_FPM_SOCKET_PATH:-/var/run/php/php-fpm.sock}"
PHP_RUN_AS_OWNER_OF_WWW_DIR="${PHP_RUN_AS_OWNER_OF_WWW_DIR:-true}"
PHP_FPM_USER="${PHP_FPM_USER:-www-data}"
PHP_FPM_GROUP="${PHP_FPM_GROUP:-www-data}"
PHP_DATE_TIMEZONE="${PHP_DATE_TIMEZONE:-UTC}"
PHP_DISPLAY_ERRORS="${PHP_DISPLAY_ERRORS:-false}"
PHP_DISPLAY_STARTUP_ERRORS="${PHP_DISPLAY_STARTUP_ERRORS:-false}"
PHP_ERROR_REPORTING="${PHP_ERROR_REPORTING:--1}"
PHP_LOG_FILE="${PHP_LOG_FILE:-/var/log/php}"
PHP_REPORT_MEMLEAKS="${PHP_REPORT_MEMLEAKS:-true}"
PHP_TRACK_ERRORS="${PHP_TRACK_ERRORS:-false}"
PHP_MEMORY_LIMIT="${PHP_MEMORY_LIMIT:-192M}"
PHP_MAX_EXECUTION_TIME="${PHP_MAX_EXECUTION_TIME:-30}"

PHP_PM_MAX_CHILDREN="${PHP_PM_MAX_CHILDREN:-$NUMBER_OF_PROCESOR}"
PHP_PM_START_SERVERS="${PHP_PM_START_SERVERS:-2}"
PHP_PM_MIN_SPARE_SERVERS="${PHP_PM_MIN_SPARE_SERVERS:-2}"
PHP_PM_MAX_SPARE_SERVERS="${PHP_PM_MAX_SPARE_SERVERS:-4}"
PHP_PM_MAX_REQUESTS="${PHP_PM_MAX_REQUESTS:-500}"

PHP_OPCACHE_ENABLE="${PHP_OPCACHE_ENABLE:-true}"
PHP_OPCACHE_ENABLE_CLI="${PHP_OPCACHE_ENABLE_CLI:-false}"
PHP_OPCACHE_VALIDATE_TIMESTAMPS="${PHP_OPCACHE_VALIDATE_TIMESTAMPS:-false}"
PHP_OPCACHE_MEMORY_CONSUMPTION="${PHP_OPCACHE_MEMORY_CONSUMPTION:-100}"
PHP_SHUTDOWN_TIMEOUT=3000



# Detect owner of $WWW_DIR directory
mkdir -p $WWW_DIR
if [[ $PHP_RUN_AS_OWNER_OF_WWW_DIR ]]; then
	# Create new user and group with UID and GID as owner of $WWW_DIR
	data_uid=$(stat -c '%u' $WWW_DIR)
	data_gid=$(stat -c '%g' $WWW_DIR)

  addgroup data > /dev/null 2>&1 && \
  log "New group data($data_gid), alias for group of $WWW_DIR, was created"

  adduser -s /bin/sh -D -G data data > /dev/null 2>&1 && \
  log "New user data($data_uid), alias for owner of $WWW_DIR, was created"

  # adduser and addgroup doen't support non-unique ID so change them manually
  sed -i "s/^\(data\):\([^:]*\):\([^:]*\):\([^:]*\):\([^:]*\):\([^:]*\):\([^:]*\)/\1:\2:$data_uid:$data_gid:\5:\6:\7/" /etc/passwd
  sed -i "s/^\(data\):\([^:]*\):\([^:]*\):\([^:]*\)/\1:\2:$data_gid:\4/" /etc/group

  PHP_FPM_USER="data"
  PHP_FPM_GROUP="data"
fi

if [ "$cmd" != "run" ]; then
    cmd="su $PHP_FPM_USER -c '$@'"
    log "running $cmd"
    eval "$cmd"
    exit $?
fi


log "generating PHP configuration ... "
template /etc/php/php-fpm.conf /var/config_templates/php/php-fpm.conf.j2
template /etc/php/php.ini /var/config_templates/php/php.ini.j2

log "testing PHP configuration ... "
quite_if_succ /usr/local/sbin/php-fpm -t -y /etc/php/php-fpm.conf
log "PHP configuration is valid"
mkdir -p `dirname "$PHP_FPM_SOCKET_PATH"`
#### Configure Nginx ###########################################################
NGINX_GENERATE_DEFAULT_SITE="${NGINX_GENERATE_DEFAULT_SITE:-true}"
NGINX_SITES_DIR="${NGINX_SITES_DIR:-/etc/nginx/sites}"
NGINX_WORKERS="${NGINX_WORKERS:-$NUMBER_OF_PROCESOR}"
NGINX_MAX_WORKER_CONNECTIONS="${NGINX_MAX_WORKER_CONNECTIONS:-1024}"
NGINX_ERROR_LOG_LEVEL="${NGINX_ERROR_LOG_LEVEL:-crit}"
NGINX_GZIP="${NGINX_GZIP:-true}"
if [ "$NGINX_ACCESS_LOG_FORMAT" = '' ]; then
    NGINX_ACCESS_LOG_FORMAT='$status $request_method $request_uri $remote_addr ${request_time}s'
fi
NGINX_SHUTDOWN_TIMEOUT=3000

if [ "$PHP_FPM_USE_SOCKET" == "true" ]; then
  max_socket_con=`cat /proc/sys/net/core/somaxconn`
  max_socker_con_per_worker=$((max_socket_con/NGINX_WORKERS))
  if [ "$NGINX_MAX_WORKER_CONNECTIONS" -gt "$max_socker_con_per_worker" ]; then
    log "WARNING: maximum number of concurrent socket connections to PHP-FPM socket is low (net.core.somaxconn=$max_socket_con), under high load will occur 502 error - Bad gateway.
    Increase value of net.core.somaxconn kernel setting or use port instead of socket (set PHP_FPM_USE_SOCKET env var to \"false\")"
  fi
fi

log "generating Nginx configuration ... "
template /etc/nginx/nginx.conf /var/config_templates/nginx/nginx.conf.j2
template /etc/nginx/php.conf /var/config_templates/nginx/php.conf.j2
template /etc/nginx/mime.types /var/config_templates/nginx/mime.types.j2
template /etc/nginx/fastcgi.conf /var/config_templates/nginx/fastcgi.conf.j2
rm -Rf "$NGINX_SITES_DIR"
mkdir -p "$NGINX_SITES_DIR"
if [ "$NGINX_GENERATE_DEFAULT_SITE" = 'true' ]; then
    template "$NGINX_SITES_DIR/default" /var/config_templates/nginx/sites/default.j2
fi

log "validating Nginx configuration ... "
quite_if_succ /usr/local/sbin/nginx -t -c /etc/nginx/nginx.conf
log "Nginx configuration is valid"


#### Configure services ########################################################
S6_SIGHUP_SCRIPT="${S6_SIGHUP_SCRIPT:-}"
S6_SIGUSR1_SCRIPT="${S6_SIGUSR1_SCRIPT:-}"
S6_SIGUSR2_SCRIPT="${S6_SIGUSR2_SCRIPT:-}"
log "generating services for s6 supervisor ... "
rm -rf /etc/s6
template /etc/s6/log /var/config_templates/s6/log.j2 executable
# S6 scripts
mkdir -p /etc/s6/.s6-svscan
template /etc/s6/.s6-svscan/finish /var/config_templates/s6/.s6-svscan/finish.j2 executable
template /etc/s6/.s6-svscan/crash /var/config_templates/s6/.s6-svscan/crash.j2 executable
template /etc/s6/.s6-svscan/stop /var/config_templates/s6/.s6-svscan/stop.j2 executable
template /etc/s6/.s6-svscan/SIGHUP /var/config_templates/s6/.s6-svscan/SIGHUP.j2 executable
template /etc/s6/.s6-svscan/SIGINT /var/config_templates/s6/.s6-svscan/SIGINT.j2 executable
template /etc/s6/.s6-svscan/SIGQUIT /var/config_templates/s6/.s6-svscan/SIGQUIT.j2 executable
template /etc/s6/.s6-svscan/SIGTERM /var/config_templates/s6/.s6-svscan/SIGTERM.j2 executable
template /etc/s6/.s6-svscan/SIGUSR1 /var/config_templates/s6/.s6-svscan/SIGUSR1.j2 executable
template /etc/s6/.s6-svscan/SIGUSR2 /var/config_templates/s6/.s6-svscan/SIGUSR2.j2 executable
# PHP logger
mkdir -p /etc/s6/php-logger
template /etc/s6/php-logger/run /var/config_templates/s6/php-logger/run.j2 executable
template /etc/s6/php-logger/finish /var/config_templates/s6/php-logger/finish.j2 executable
template /etc/s6/php-logger/notification-fd /var/config_templates/s6/php-logger/notification-fd.j2
# PHP service
mkdir -p /etc/s6/php
template /etc/s6/php/run /var/config_templates/s6/php/run.j2 executable
template /etc/s6/php/finish /var/config_templates/s6/php/finish.j2 executable
template /etc/s6/php/notification-fd /var/config_templates/s6/php/notification-fd.j2
template /etc/s6/php/log/run /var/config_templates/s6/php/log/run.j2 executable
# Nginx service
mkdir -p /etc/s6/nginx
template /etc/s6/nginx/run /var/config_templates/s6/nginx/run.j2 executable
template /etc/s6/nginx/finish /var/config_templates/s6/nginx/finish.j2 executable
template /etc/s6/nginx/notification-fd /var/config_templates/s6/nginx/notification-fd.j2
template /etc/s6/nginx/log/run /var/config_templates/s6/nginx/log/run.j2 executable


#### Run, Forrest, run! ########################################################
  if [ -t 0 ]; then set -m; fi # run background jobs in a separate process group
  log "running supervisor (s6-svscan)"
  /bin/s6-svscan -s /etc/s6 &
  s6_pid=$!
  trap '' EXIT
  trap '/bin/kill -s TERM $s6_pid; wait $s6_pid' INT TERM QUIT
  trap '/bin/kill -s HUP  $s6_pid; wait $s6_pid' HUP
  trap '/bin/kill -s USR1 $s6_pid; wait $s6_pid' USR1
  trap '/bin/kill -s USR2 $s6_pid; wait $s6_pid' USR2
  wait $s6_pid
