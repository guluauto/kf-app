#!/usr/local/bin/node

var shell = require('shelljs');

upload();

function upload() {
  shell.cp('-rf', 'platforms/android/ant-build/MainActivity-debug.apk', './');
  shell.mv('MainActivity-debug.apk', 'kf.apk');
  var scp = shell.exec('scp ./kf.apk xyh@guluabc.com:/home/xyh/app-getter/public/kf.apk');
  console.log(scp.output);
  shell.exec('rm -rf ./kf.apk');
}

