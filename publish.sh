#!/bin/bash

rm -rf ./www/*
mv hooks/before_build hooks/before_build_bak
mv hooks/after_build hooks/after_build_bak

cp -rf ../demigod/dist/* ./www
grep -rl "o.dp:3001" ./www | xargs sed -i '' 's/o.dp:3001/cs.guluauto.com/g'
cordova build android --release

mv hooks/before_build_bak hooks/before_build
mv hooks/after_build_bak hooks/after_build

# cordova run android --debug
scp ./platforms/android/ant-build/MainActivity-release.apk xyh@guluabc.com:/home/xyh/app-getter/public/kf-prd.apk
exit
