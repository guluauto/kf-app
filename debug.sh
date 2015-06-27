#!/bin/bash

rm -rf ./www/*
mv hooks/before_build hooks/before_build_bak
cp -rf ../demigod/dist/* ./www
grep -rl "o.dp:3000" ./www | xargs sed -i '' 's/o.dp:3000/t.ifdiu.com/g'
cordova build android --debug
mv hooks/before_build_bak hooks/before_build
cordova run android --debug
exit
