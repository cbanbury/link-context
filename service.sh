#!/bin/bash
# Manually configure
CONTEXT_SEED=1
CONTEXT_PORT=8000
CONTEXT_DOMAIN="localhost"
SERVER_DIR=

NAME=link-context
IPC=/var/run/link-context/$NAME.ipc
DESC="link-context server"
LOG_DIR=/var/log/link-context
WORKERS=1

case "$1" in
  start)
    echo -n "Starting $DESC: "
    naught start --worker-count $WORKERS --ipc-file $IPC --log $LOG_DIR/naught.log --stdout $LOG_DIR/stdout.log --stderr $LOG_DIR/stderr.log --cwd $SERVER_DIR $SERVER_DIR/server.js
    exit $?
  ;;
  stop)
    echo -n "Stopping $DESC: "
    naught stop --timeout 60 $IPC
    exit $?
  ;;
  restart)
    echo "Restarting $DESC: "
    $0 status 2> /dev/null
    if [[ $? -ne 0 ]]; then
      echo 'server not started, starting: '
      $0 start
      exit $?
    else
      echo 'server already running, deploying: '
      naught deploy --timeout 60 --worker-count $WORKERS --cwd $SERVER_DIR $IPC
      exit $?
    fi
  ;;
  status)
    naught status $IPC
    exit $?
  ;;
  *)
    echo "Usage: /etc/init.d/$NAME {start|stop|reload|restart|status}" >&2
    exit 1
  ;;
esac

exit 0
