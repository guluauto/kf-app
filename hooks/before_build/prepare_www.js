#!/usr/local/bin/node

// 下载最新的静态包，并解压，存放在 www 目录
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');

// 静态包信息
var projname = 'demigod';
var owner = 'f2e';
var version = '0.0.0';

var gz_name = 'www.tar.gz';

var appjs_path = './www/js/app.js';
var alpha = /[a-z]+[0-9]*\.ifdiu\.com/g;
var local = /o\.dp\:[0-9]{2,5}/g;
var prd = 'cs.guluabc.com';

before_build();

function before_build() {
  console.info('正在下载静态包' + owner +  '/' + projname);
  var www_tar_gz_url = '"http://d.ifdiu.com/f2e/alpha/' + projname + '?secret=yunhua@926&owner=' + owner + '&version=' + version + '"';
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

  shell.rm('-rf', './www/*');
  shell.cp('-rf', './' + version + '/*', './www');
  shell.rm('-rf', ['./' + version, './' + gz_name]);

  try {
    console.log('更换服务端接口地址为线上地址');
    var appjs = fs.readFileSync(appjs_path, {
      encoding: 'utf8'
    });
    appjs = appjs.replace(alpha, prd).replace(local, prd);
    fs.writeFileSync(appjs_path, appjs, { encoding: 'utf8' });
    console.log('更换服务端接口地址成功');
  } catch (e) {
    console.error('更换服务器接口地址失败');
    console.error(e);
  }

  console.log('静态包处理成功');
}

