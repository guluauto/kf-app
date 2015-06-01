#!/usr/bin/env node

// 下载最新的静态包，并解压，存放在 www 目录
var path = require('path');
var shell = require('shelljs');

// 静态包信息
var projname = 'uctsp-wx';
var owner = 'f2e';
var version = '0.0.0';

var gz_name = 'www.tar.gz';

console.info('正在下载静态包' + owner +  '/' + projname);
var www_tar_gz_url = 'http://d.ifdiu.com/f2e/alpha/' + projname + '?secret=yunhua@926&owner=' + owner + '&version=' + version;
var curl_tar_gz = shell.exec(['curl', www_tar_gz_url, '>', gz_name].join(' '));
if (curl_tar_gz.code !== 0) {
  console.error('下载静态包' + www_tar_gz_url + '失败');
  console.error('错误信息:\n' + curl_tar_gz.output);

  return;
}
console.log('下载静态包' + gz_name + '成功');

console.log('解压静态包' + gz_name);
var untargz = shell.exec(['tar -xzvf', gz_name].join(' '));
if (untargz.code !== 0) {
  console.error('解压静态包' + gz_name + '失败');
  console.error('错误信息:\n' + untargz.output);

  return;
}
console.log('解压静态包' + gz_name + '成功');

shell.cp('-rf', './' + version + '/*', './www');
shell.rm('-rf', ['./' + version, './' + gz_name]);
