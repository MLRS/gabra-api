#!/bin/sh

if [ "$#" -ne 1 ]; then
    echo 'Need a JavaScript file as argument'
    exit 1
fi

mongo localhost/gabra --username gabra_user --password gabra_pass $1
