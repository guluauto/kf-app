// 应用入口
// Module: gulu
// Dependencies:
//    ngRoute, httpInterceptors, gulu.missing

/* global fallbackHash */
angular
  .module('gulu', [
    'ui.router',
    'ngLocale',
    'toastr',
    'ui.bootstrap',
    'custom.directives',
    'httpInterceptors',
    'chieffancypants.loadingBar',
    'util.filters',
    'util.date',
    'gulu.login',
    'gulu.client_service',
    'gulu.missing'
  ])
  .config(["$locationProvider", "$urlRouterProvider", "$stateProvider", function($locationProvider, $urlRouterProvider, $stateProvider) {
    // not use html5 history api
    // but use hashbang
    $locationProvider
      .html5Mode(false)
      .hashPrefix('!');

    // define 404
    $urlRouterProvider
      .otherwise('/login');

    // API Server
    API_SERVERS = {
      tester: 'http://c.guluabc.com'
      // tester: 'http://c.guluabc.com'
    };
  }])
  .run(["$rootScope", "$location", "$state", "$stateParams", function($rootScope, $location, $state, $stateParams) {
    var reg = /[\&\?]_=\d+/;

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    // 用于返回上层页面
    $rootScope
      .$watch(function() {
        return $location.url();
      }, function(current, old) {
        if (current.replace(reg, '') === old.replace(reg, '')) {
          return;
        }

        $rootScope.backUrl = old;
      });

    $rootScope.back = function() {
      $location.url($rootScope.backUrl);
    }
  }]);


angular
  .module('gulu.client_service', [
    'ui.router',
    'gulu.indent'
  ])
  .config(["$stateProvider", function($stateProvider) {
    $stateProvider
      .state('client_service', {
        abstract: true,
        url: '/indents',
        templateUrl: 'client-service/dashboard.htm'
      })
      .state('client_service.list', {
        url: '',
        templateUrl: 'indent/list.htm',
        controller: 'IndentListCtrl'
      })
      .state('client_service.approval', {
        url: '/approval',
        templateUrl: 'indent/list_approval.htm',
        controller: 'IndentApprovalListCtrl'
      })
      .state('client_service.indent', {
        url: '/{indent_id:[0-9]+}',
        templateUrl: 'indent/edit.htm',
        controller: 'IndentCtrl'
      });
  }]);

angular
  .module('gulu.indent', [
    'gulu.indent.svcs',
    'gulu.indent.enums'
  ]);

angular
  .module('gulu.login', [
    'ui.router',
    'gulu.login.svcs'
  ])

  .config(["$stateProvider", function($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'login/login.htm',
        controller: 'LoginCtrl'
      });
  }]);

// 404 页面
// Module: gulu.missing
// Dependencies: ngRoute

angular
  .module('gulu.missing', ['ui.router'])

  // 配置 route
  .config(["$stateProvider", function ($stateProvider) {
    $stateProvider
      .state('missing', {
        url: '/missing',
        templateUrl: '404/404.htm',
        controller: 'MissingCtrl'
      });
  }])

  // 404 controller
  .controller('MissingCtrl', ["$scope", function ($scope) {
    console.log('I`m here');
    // TODO:
    // 1. show last path and page name
  }]);

// 自定义 directives

angular
  .module('custom.directives', [])
  .directive('ngIndeterminate', ["$compile", function($compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attributes) {
        scope.$watch(attributes['ngIndeterminate'], function(value) {
          element.prop('indeterminate', !!value);
        });
      }
    };
  }]);

angular
  .module('util.filters', [])

  .filter('mobile', function() {
    return function(s) {
      if (s == null) {
        return '';
      }

      s = s.replace(/[\s\-]+/g, '');

      if (s.length < 3) {
        return s;
      }

      var sa = s.split('');

      sa.splice(3, 0, '-');

      if (s.length >= 7) {
        sa.splice(8, 0, '-');
      }

      return sa.join('');
    };
  });

angular
  .module('util.date', [])
  .factory('DateUtil', function () {
    var toString = function (date, s) {
      return date.getFullYear() + s + (date.getMonth() + 1) + s + date.getDate();
    }

    return {
      toLocalDateString: function (date) {
        return toString(date, '-');
      },

      toLocalTimeString: function(date) {
        var h = date.getHours();
        var m = date.getMinutes();

        if (h < 10) {
          h = '0' + h;
        }

        if (m < 10) {
          m = '0' + m;
        }

        return [toString(date, '-'), h + ':' + m].join(' ');
      }
    }
  });
// 枚举 Service
angular
  .module('util.enums', [])
  .factory('Enums', function () {
    return function (ENUMS) {
      return {
        val: function (name, text) {
          return ENUMS[name].find(function (item) {
            return item.text === text;
          }).value;
        },
        text: function (name, val) {
          return ENUMS[name].find(function (item) {
            return item.value === val;
          }).text;
        },
        item: function (name, val) {
          return ENUMS[name].find(function (item) {
            return item.value === val;
          });
        },
        list: function (name) {
          return ENUMS[name];
        },
        items: function (name, vals) {
          return ENUMS[name].filter(function (item) {
            return vals.indexOf(item.value) !== -1;
          });
        }
      };
    };
  });
angular
  .module('httpInterceptors', [])

  .config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
    
    // Angular $http isn’t appending the header X-Requested-With = XMLHttpRequest since Angular 1.3.0
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }])

  .factory('httpInterceptor', ["$q", "$rootScope", function($q, $rootScope) {
    return {
      // 请求前修改 request 配置
      'request': function(config) {
        // 若请求的是模板，或已加上时间戳的 url 地址，则不需要加时间戳
        if (config.url.indexOf('.htm') !== -1 || config.url.indexOf('?_=') !== -1) {
          return config;
        }

        config.url = config.url + '?_=' + new Date().getTime();

        return config;
      },

      // 请求出错，交给 error callback 处理
      'requestError': function(rejection) {
        return $q.reject(rejection);
      },

      // 响应数据按约定处理
      // {
      //   code: 200, // 自定义状态码，200 成功，非 200 均不成功
      //   msg: '操作提示', // 不能和 data 共存
      //   data: {} // 用户数据
      // }
      'response': function(response) {
        // 服务端返回的有效用户数据
        var data, code;

        if (angular.isObject(response.data)) {
          code = response.data.code;
          data = response.data.data;

          // 若 status 200, 且 code !200，则返回的是操作错误提示信息
          // 那么，callback 会接收到下面形式的参数：
          // { code: 20001, msg: '操作失败' }
          if (code !== 200) {
            return $q.reject(response);
          }

          // 若服务端返回的 data !null，则返回的是有效地用户数据
          // 那么，callback 会接收到下面形式参数：
          // { items: [...], total_count: 100 }
          if (data != null) {
            response.data = data;
          }

          // 若服务端返回的 data 值为 null，则返回的是提示信息
          // 那么 callback 会接收到下面形式的参数：
          // { code: 200, msg: '操作成功' }
          // 默认为此
        }

        return response;
      },

      // 响应出错，交给 error callback 处理
      'responseError': function(rejection) {
        return $q.reject(rejection);
      }
    };
  }]);
'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
  var PLURAL_CATEGORY = {
    ZERO: "zero",
    ONE: "one",
    TWO: "two",
    FEW: "few",
    MANY: "many",
    OTHER: "other"
  };
  $provide.value("$locale", {
    "DATETIME_FORMATS": {
      "AMPMS": [
        "\u4e0a\u5348",
        "\u4e0b\u5348"
      ],
      "DAY": [
        "\u661f\u671f\u65e5",
        "\u661f\u671f\u4e00",
        "\u661f\u671f\u4e8c",
        "\u661f\u671f\u4e09",
        "\u661f\u671f\u56db",
        "\u661f\u671f\u4e94",
        "\u661f\u671f\u516d"
      ],
      "MONTH": [
        "1\u6708",
        "2\u6708",
        "3\u6708",
        "4\u6708",
        "5\u6708",
        "6\u6708",
        "7\u6708",
        "8\u6708",
        "9\u6708",
        "10\u6708",
        "11\u6708",
        "12\u6708"
      ],
      "SHORTDAY": [
        "\u5468\u65e5",
        "\u5468\u4e00",
        "\u5468\u4e8c",
        "\u5468\u4e09",
        "\u5468\u56db",
        "\u5468\u4e94",
        "\u5468\u516d"
      ],
      "SHORTMONTH": [
        "1\u6708",
        "2\u6708",
        "3\u6708",
        "4\u6708",
        "5\u6708",
        "6\u6708",
        "7\u6708",
        "8\u6708",
        "9\u6708",
        "10\u6708",
        "11\u6708",
        "12\u6708"
      ],
      "fullDate": "y\u5e74M\u6708d\u65e5EEEE",
      "longDate": "y\u5e74M\u6708d\u65e5",
      "medium": "yyyy-M-d ah:mm:ss",
      "mediumDate": "yyyy-M-d",
      "mediumTime": "ah:mm:ss",
      "short": "yy-M-d ah:mm",
      "shortDate": "yy-M-d",
      "shortTime": "ah:mm"
    },
    "NUMBER_FORMATS": {
      "CURRENCY_SYM": "\u00a5",
      "DECIMAL_SEP": ".",
      "GROUP_SEP": ",",
      "PATTERNS": [{
        "gSize": 3,
        "lgSize": 3,
        "macFrac": 0,
        "maxFrac": 3,
        "minFrac": 0,
        "minInt": 1,
        "negPre": "-",
        "negSuf": "",
        "posPre": "",
        "posSuf": ""
      }, {
        "gSize": 3,
        "lgSize": 3,
        "macFrac": 0,
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
        "negPre": "(\u00a4",
        "negSuf": ")",
        "posPre": "\u00a4",
        "posSuf": ""
      }]
    },
    "id": "zh-cn",
    "pluralCat": function(n) {
      return PLURAL_CATEGORY.OTHER;
    }
  });
}]);

angular
  .module('gulu.indent')
  
  .controller('IndentCtrl', ["$scope", "$rootScope", "$location", "$timeout", "$filter", "toastr", "DateUtil", "IndentsSvc", "IndentSvc", "IndentEnums", function ($scope, $rootScope, $location, $timeout, $filter, toastr, DateUtil, IndentsSvc, IndentSvc, IndentEnums) {
    var vm = $scope;

    var indent_id = vm.$stateParams.indent_id;

    vm.type_list = IndentEnums.list('type');
    vm.channel_list = IndentEnums.list('channel');
    // vm.brand_list = IndentEnums.list('brand');
    // vm.series_list = IndentEnums.list('series');

    vm.submit = submit;
    vm.cancel = cancel;
    vm.cancel_confirm = cancel_confirm;
    vm.open_datepicker = open_datepicker;

    function submit() {
      return IndentSvc
        .update({
          id: vm.id
        }, {
          type: vm.type.value,
          reserver: vm.reserver,
          mobile: vm.mobile.replace(/[\s\-]+/g, ''),
          test_time: vm.test_time,
          address: vm.address,
          memo: vm.memo,
          channel: vm.channel.value,
          status: 2
        })
        .$promise
        .then(function(res) {
          toastr.success(res.msg || '预约单确认并生效成功');

          $timeout(function() {
            $rootScope.back();
          }, 2000);
        })
        .catch(function(res) {
          toastr.error(res.msg || '预约单确认并生效失败，请重试');
        });
    }

    function open_datepicker($event) {
      $event.preventDefault();
      $event.stopPropagation();

      vm.test_time_open = true;
    }

    function cancel() {
      IndentSvc
        .remove({
          id: vm.id
        })
        .$promise
        .then(function(res) {
          toastr.success(res.msg || '取消预约单成功');

          $timeout(function() {
            $rootScope.back();
          }, 2000);
        })
        .catch(function(res) {
          toastr.error(res.msg || '取消预约单失败，请重试');
        });
    }

    function cancel_confirm() {
      IndentSvc
        .update({
          id: vm.id
        }, {
          status: 1
        })
        .$promise
        .then(function(res) {
          toastr.success(res.msg || '已取消确认订单');

          $rootScope.back();
        })
        .catch(function(res) {
          toastr.error(res.msg || '取消确认订单，请重试');
        });
    }

    function select_item(list_name, value) {
      vm[list_name] = IndentEnums.item(list_name, value);
    }

    function watch_test_time_part() {
      vm.$watch('test_time_before', function(test_time_before) {
        if (test_time_before && !vm.edit_form.test_time_before.$pristine) {
          vm.test_time_after = new Date(test_time_before);  
        }
      });

      vm.$watch('test_time_after', function(test_time_after) {
        if (test_time_after && !vm.edit_form.test_time_after.$pristine) {
          vm.test_time = DateUtil.toLocalTimeString(test_time_after);
        }
      });
    }

    function set_selected_item() {
      select_item('type', vm.type);
      select_item('channel', vm.channel);
      // select_item('brand', vm.car.brand);
      // select_item('series', vm.car.series);
    }

    // 新建预约单
    if (indent_id == 0) {
      return IndentsSvc
        .save()
        .$promise
        .then(function(res) {
          angular.extend(vm, res.toJSON());

          set_selected_item();
          watch_test_time_part();
        })
        .catch(function(res) {
          toastr.error(res.msg || '新建预约单失败，请刷新重试');
        });
    }

    // 若更新预约单，则获取预约单信息
    IndentSvc
      .get({
        id: indent_id
      })
      .$promise
      .then(function(res) {
        angular.extend(vm, res.toJSON());

        var test_time_sp = vm.test_time.split(' ');

        vm.test_time_before = test_time_sp[0];
        vm.test_time_after = new Date(vm.test_time);

        set_selected_item();
        watch_test_time_part();
      })
      .catch(function(res) {
        toastr.error(res.msg || '获取订单信息失败，请刷新重试');
      });
  }]);
angular
  .module('gulu.indent.enums', ['util.enums'])

.factory('IndentEnums', ["Enums", function(Enums) {
  var ENUMS = {
    type: [{
      text: '全部',
      value: 0
    }, {
      text: '检测',
      value: 1
    }, {
      text: '质保',
      value: 2
    }, {
      text: '维修',
      value: 3
    }, {
      text: '保养',
      value: 4
    }],

    channel: [{
      text: '全部',
      value: 0
    }, {
      text: '商家',
      value: 1
    }, {
      text: '个人',
      value: 2
    }],

    brand: [{
      text: '全部',
      value: 0
    }, {
      text: '奥迪',
      value: 1
    }, {
      text: '奔驰',
      value: 2
    }],

    series: [{
      text: '全部',
      value: 0
    }, {
      text: 'A1',
      value: 1
    }, {
      text: 'A2',
      value: 2
    }],

    status: [{
      text: '全部',
      value: 0
    }, {
      text: '待客服确认',
      value: 1
    }, {
      text: '待生效',
      value: 1001
    }, {
      text: '待客服分配检测师',
      value: 2
    }, {
      text: '客服审核取消',
      value: 3
    }, {
      text: '待检测师确认',
      value: 4
    }, {
      text: '待检测',
      value: 5
    }, {
      text: '检测师检测中',
      value: 6
    }, {
      text: '已取消',
      value: 7
    }, {
      text: '待报告',
      value: 8
    }, {
      text: '已发布报告',
      value: 9
    }, {
      text: '已发布作业',
      value: 10
    }],

    city: [{
      text: '全部',
      value: 0
    }, {
      text: '西安',
      value: 1
    }],

    tester: [{
      text: '全部',
      value: 0
    }, {
      text: '张师傅',
      value: 1
    }, {
      text: '胡师傅',
      value: 2
    }],

    role: [{
      text: '全部',
      value: 0
    }, {
      text: '客服',
      value: 1
    }, {
      text: '检测师',
      value: 2
    }, {
      text: '编辑',
      value: 3
    }, {
      text: '增值顾问',
      value: 4
    }, {
      text: '维修师',
      value: 5
    }, {
      text: '帮买师',
      value: 6
    }, {
      text: '管理员',
      value: 7
    }],

    from: [{
      text: '全部',
      value: 0
    }, {
      text: '来电',
      value: 1
    }, {
      text: '网站',
      value: 2
    }, {
      text: '微信',
      value: 3
    }, {
      text: '58通常',
      value: 4
    }],

    size: [{
      text: 10,
      value: 10
    }, {
      text: 15,
      value: 15
    }, {
      text: 20,
      value: 20
    }, {
      text: 50,
      value: 50
    }, {
      text: 100,
      value: 100
    }]
  };

  return Enums(ENUMS);
}]);

angular
  .module('gulu.indent.svcs', ['ngResource'])
  
  .service('IndentsSvc', ["$resource", function ($resource) {
    return $resource(API_SERVERS.tester + '/orders', {}, {
      query: {
        isArray: false
      }
    });
  }])

  .service('IndentSvc', ["$resource", function ($resource) {
    return $resource(API_SERVERS.tester + '/orders/:id', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }])

  .service('IndentTesterSvc', ["$resource", function ($resource) {
    return $resource(API_SERVERS.tester + '/orders/:id/tester', {
      id: '@id'
    });
  }])

  .service('TestersSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.tester + '/testers', {}, {
      query: {
        isArray: false
      }
    });
  }])

  .service('IndentApprovalSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.tester + '/orders/:id/approval', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }]);
/* global angular */
angular
  .module('gulu.indent')
  
  .controller('IndentListCtrl', ["$scope", "$location", "$q", "toastr", "$modal", "IndentsSvc", "IndentApprovalSvc", "IndentSvc", "IndentEnums", function($scope, $location, $q, toastr, $modal,
    IndentsSvc, IndentApprovalSvc, IndentSvc, IndentEnums) {
    var vm = $scope;
    var qso = $location.search();

    vm.status_id = parseInt(qso.status_id) || 0;
    vm.city_id = parseInt(qso.city_id) || 0;
    vm.tester_id = parseInt(qso.tester_id) || 0;
    vm.role_id = parseInt(qso.role_id) || 0;
    vm.mobile = qso.mobile || '';

    vm.status = IndentEnums.item('status', vm.status_id);
    vm.status_list = IndentEnums.list('status');
    vm.city = IndentEnums.item('city', vm.city_id);
    vm.city_list = IndentEnums.list('city');
    vm.role = IndentEnums.item('role', vm.role_id);
    vm.role_list = IndentEnums.list('role');
    vm.tester = IndentEnums.item('tester', vm.tester_id);
    vm.tester_list = IndentEnums.list('tester');

    vm.page = parseInt(qso.page) || 1;
    vm.size = parseInt(qso.size) || 20;
    vm.sizes = IndentEnums.list('size');
    vm.size_item = IndentEnums.item('size', vm.size);

    vm.size_change = size_change;
    vm.page_change = page_change;
    vm.search = search;
    vm.confirm_order = confirm_order;
    vm.dispatch_tester = dispatch_tester;
    vm.cancel_order = cancel_order;
    vm.approval = approval;

    watch_list('status', 'status_id');
    watch_list('city', 'city_id');
    watch_list('role', 'role_id');
    watch_list('tester', 'tester_id');

    query();

    function query() {
      var params = {
        size: vm.size,
        page: vm.page,

        status_id: vm.status_id,
        city_id: vm.city_id,
        tester_id: vm.tester_id,
        role_id: vm.role_id,
        mobile: vm.mobile
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.status_text = IndentEnums.text('status', item.status);
          });

          vm.items = rs.items;
          vm.total_count = rs.total_count;

          var tmp = rs.total_count / vm.size;
          vm.page_count = rs.total_count % vm.size === 0 ? tmp : (Math.floor(tmp) + 1);
        })
        .catch(function(res) {
          toastr.error(res.data.msg || '查询失败，服务器发生未知错误，请重试');
        });
    }

    vm.$watchCollection('items', function(items) {
      vm.items = items;
    });

    function watch_list(name, field) {
      vm.$watch(name, function(item) {
        vm[field] = item.value;
      });
    }

    function fetch_order(id) {
      return IndentSvc
        .get({
          id: id
        })
        .$promise
        .then(function(order) {
          if (order.status !== 1) {
            var index = _.findIndex(vm.items, function(item) {
              return item.id === order.id;
            });

            order = order.toJSON();

            order.status_text = IndentEnums.text('status', order.status);
            order.confirm_by_other = true;

            vm.items.splice(index, 1, order);

            return $q.reject({
              msg: '该订单已被其他客服确认'
            });
          }
        });
    }

    // 确认订单
    function confirm_order(item) {
      var _confirm_order = function() {
        return IndentSvc
          .update({
            id: item.id
          }, {
            status: 1001
          })
          .$promise;
      };

      return $q
        .when(fetch_order(item.id))
        .then(_confirm_order)
        .then(function(res) {
          toastr.success(res.msg || '已确认该订单');

          $location.url('/indents/' + item.id);
        })
        .catch(function(res) {
          toastr.error(res.msg || '确认该订单失败');
        });
    }

    // 分配检测师
    function dispatch_tester(item) {
      var _dispatch_tester = function() {
        var dispatch_tester_ins = $modal.open({
          templateUrl: 'indent/dispatch_tester.htm',
          controller: 'DispatchCtrl',
          backdrop: 'static',
          resolve: {
            indent_info: function() {
              return item;
            }
          }
        });

        dispatch_tester_ins.result.then(function(tester) {
          // TODO:
          // 更新预约单状态
          query();
        });
      }
      
      $q
        .when(fetch_order(item.id))
        .then(_dispatch_tester)
        .catch(function(res) {
          toastr.error(res.msg || '分配检测师失败');
        });

      return false;
    }

    // 取消订单
    function cancel_order(item) {
      var cancel_order_ins = $modal.open({
        templateUrl: 'indent/cancel_order.htm',
        controller: 'CancelOrderCtrl',
        backdrop: 'static',
        resolve: {
          indent_info: function() {
            return item;
          }
        }
      });

      cancel_order_ins.result.then(function(tester) {
        // TODO:
        // 更新预约单状态
        query();
      });
    }

    // 审核取消
    function approval(item) {
      if (confirm('确认同意取消该订单？')) {
        IndentApprovalSvc
          .update({
            id: item.id
          })
          .$promise
          .then(function(res) {
            toastr.success(res.msg || '同意取消该订单，操作成功');

            query();
          })
          .catch(function(res) {
            toastr.error(res.msg || '提交失败，请重试');
          });
      }
    }

    // 每页条数改变
    function size_change(size) {
      vm.size = size;
      vm.page = 1;

      query();
    }

    // 翻页
    function page_change(page) {
      vm.page = page;

      query();
    }

    // 查询提交
    function search() {
      vm.page = 1;

      query();
    }
  }])
  
  // 待审批列表
  .controller('IndentApprovalListCtrl', ["$scope", "$location", "toastr", "IndentsSvc", "IndentApprovalSvc", "IndentEnums", function($scope, $location, toastr, IndentsSvc, IndentApprovalSvc, IndentEnums) {
    var vm = $scope;
    var qso = $location.search();
    
    vm.page = parseInt(qso.page) || 1;
    vm.size = parseInt(qso.size) || 20;
    vm.sizes = IndentEnums.list('size');
    vm.size_item = IndentEnums.item('size', vm.size);

    vm.size_change = size_change;
    vm.page_change = page_change;
    vm.approval = approval;

    query();

    function query() {
      var params = {
        size: vm.size,
        page: vm.page,
        status_id: 3
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.status_text = IndentEnums.text('status', item.status);
          });

          vm.items = rs.items;
          vm.total_count = rs.total_count;

          var tmp = rs.total_count / vm.size;
          vm.page_count = rs.total_count % vm.size === 0 ? tmp : (Math.floor(tmp) + 1);
        })
        .catch(function(res) {
          toastr.error(res.data.msg || '查询失败，服务器发生未知错误，请重试');
        });
    }

    // 审核取消
    function approval(item) {
      if (confirm('确认同意取消该订单？')) {
        IndentApprovalSvc
          .update({
            id: item.id
          })
          .$promise
          .then(function(res) {
            toastr.success(res.msg || '同意取消该订单，操作成功');

            query();
          })
          .catch(function(res) {
            toastr.error(res.msg || '提交失败，请重试');
          });
      }
    }

    // 每页条数改变
    function size_change(size) {
      vm.size = size;
      vm.page = 1;

      query();
    }

    // 翻页
    function page_change(page) {
      vm.page = page;

      query();
    }

  }])

  // 分配检测师
  .controller('DispatchCtrl', ["$scope", "$modalInstance", "toastr", "IndentTesterSvc", "TestersSvc", "indent_info", function($scope, $modalInstance, toastr, IndentTesterSvc, TestersSvc, indent_info) {
    var vm = $scope;

    angular.extend(vm, indent_info);

    vm.page = 1;
    vm.query = query;

    vm.cancel = cancel;
    vm.dispatch = dispatch;

    query(1);

    function query(page) {
      vm.page = page;

      TestersSvc
        .query({
          time: indent_info.test_time,
          page: page
        })
        .$promise
        .then(function(res) {
          vm.items = res.items;
          vm.total_count = res.total_count;
        })
        .catch(function(res) {
          toastr.error(res.msg || '获取空档期检测师失败，请重试');
        });
    }

    function dispatch(tester) {
      vm.dispatch_status = true;

      IndentTesterSvc
        .save({
          id: indent_info.id
        }, {
          tester_id: tester.id
        })
        .$promise
        .then(function(res) {
          toastr.success(res.msg || '分配检测师成功');

          $modalInstance.close(tester);
        })
        .catch(function(res) {
          vm.dispatch_status = false;
          toastr.error(res.msg || '分配检测师失败，请重试');
        });
    }

    function cancel() {
      $modalInstance.dismiss();
    }
  }])
  
  // 取消订单
  .controller('CancelOrderCtrl', ["$scope", "$modalInstance", "toastr", "IndentSvc", "indent_info", function($scope, $modalInstance, toastr, IndentSvc, indent_info) {
    var vm = $scope;

    angular.extend(vm, indent_info);

    vm.cancel_order = cancel_order;
    vm.cancel = cancel;

    function cancel_order() {
      vm.cancel_order_status = true;

      IndentSvc
        .remove({
          id: indent_info.id
        }, {
          reason: vm.reason
        })
        .$promise
        .then(function(res) {
          toastr.success(res.msg || '订单取消成功');

          $modalInstance.close();
        })
        .catch(function(res) {
          vm.cancel_order_status = false;

          toastr.error(res.msg || '订单取消失败，请重试');
        });
    }

    function cancel() {
      $modalInstance.dismiss();
    }
  }]);


angular
  .module('gulu.login')
  
  .controller('LoginCtrl', ["$scope", "$q", "$location", "$timeout", "toastr", "LoginSvc", function ($scope, $q, $location, $timeout, toastr, LoginSvc) {
    var vm = $scope;

    vm.login = login;

    function login() {
      return LoginSvc
        .save({
          job_no: vm.job_no,
          password: vm.password
        })
        .$promise
        .then(function(data) {
          toastr.success(data.msg || '登录成功，正在为你跳转...');

          $timeout(function() {
            $location.url('/indents');
          }, 2000);
        })
        .catch(function(res) {
          toastr.error(res.msg || '登录失败，请重试');
        });
    }
  }]);
angular
  .module('gulu.login.svcs', ['ngResource'])
  .service('LoginSvc', ["$resource", function ($resource) {
    return $resource(API_SERVERS.tester + '/user/login');
  }])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNsaWVudC1zZXJ2aWNlL2NsaWVudF9zZXJ2aWNlX21vZHVsZS5qcyIsImluZGVudC9pbmRlbnRfbW9kdWxlLmpzIiwibG9naW4vbG9naW5fbW9kdWxlLmpzIiwiNDA0LzQwNF9jdHJsLmpzIiwiY29tcG9uZW50L2N1c3RvbS1kaXJlY3RpdmUuanMiLCJjb21wb25lbnQvY3VzdG9tLWZpbHRlci5qcyIsImNvbXBvbmVudC9kYXRlLmpzIiwiY29tcG9uZW50L2VudW1zLmpzIiwiY29tcG9uZW50L2h0dHAuanMiLCJjb21wb25lbnQvemgtY24uanMiLCJpbmRlbnQvZWRpdF9jdHJsLmpzIiwiaW5kZW50L2VudW1zLmpzIiwiaW5kZW50L2luZGVudF9zdmNzLmpzIiwiaW5kZW50L2xpc3RfY3RybC5qcyIsImxvZ2luL2xvZ2luX2N0cmwuanMiLCJsb2dpbi9sb2dpbl9zdmNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUFNQTtHQUNBLE9BQUEsUUFBQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTs7R0FFQSxxRUFBQSxTQUFBLG1CQUFBLG9CQUFBLGdCQUFBOzs7SUFHQTtPQUNBLFVBQUE7T0FDQSxXQUFBOzs7SUFHQTtPQUNBLFVBQUE7OztJQUdBLGNBQUE7TUFDQSxRQUFBOzs7O0dBSUEsMERBQUEsU0FBQSxZQUFBLFdBQUEsUUFBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBOztJQUVBLFdBQUEsU0FBQTtJQUNBLFdBQUEsZUFBQTs7O0lBR0E7T0FDQSxPQUFBLFdBQUE7UUFDQSxPQUFBLFVBQUE7U0FDQSxTQUFBLFNBQUEsS0FBQTtRQUNBLElBQUEsUUFBQSxRQUFBLEtBQUEsUUFBQSxJQUFBLFFBQUEsS0FBQSxLQUFBO1VBQ0E7OztRQUdBLFdBQUEsVUFBQTs7O0lBR0EsV0FBQSxPQUFBLFdBQUE7TUFDQSxVQUFBLElBQUEsV0FBQTs7Ozs7QUN6REE7R0FDQSxPQUFBLHVCQUFBO0lBQ0E7SUFDQTs7R0FFQSwwQkFBQSxTQUFBLGdCQUFBO0lBQ0E7T0FDQSxNQUFBLGtCQUFBO1FBQ0EsVUFBQTtRQUNBLEtBQUE7UUFDQSxhQUFBOztPQUVBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7O09BRUEsTUFBQSwyQkFBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7T0FFQSxNQUFBLHlCQUFBO1FBQ0EsS0FBQTtRQUNBLGFBQUE7UUFDQSxZQUFBOzs7O0FDekJBO0dBQ0EsT0FBQSxlQUFBO0lBQ0E7SUFDQTs7O0FDSEE7R0FDQSxPQUFBLGNBQUE7SUFDQTtJQUNBOzs7R0FHQSwwQkFBQSxTQUFBLGdCQUFBO0lBQ0E7T0FDQSxNQUFBLFNBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7Ozs7Ozs7O0FDUEE7R0FDQSxPQUFBLGdCQUFBLENBQUE7OztHQUdBLDBCQUFBLFVBQUEsZ0JBQUE7SUFDQTtPQUNBLE1BQUEsV0FBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7Ozs7R0FLQSxXQUFBLDBCQUFBLFVBQUEsUUFBQTtJQUNBLFFBQUEsSUFBQTs7Ozs7OztBQ2pCQTtHQUNBLE9BQUEscUJBQUE7R0FDQSxVQUFBLGdDQUFBLFNBQUEsVUFBQTtJQUNBLE9BQUE7TUFDQSxVQUFBO01BQ0EsTUFBQSxTQUFBLE9BQUEsU0FBQSxZQUFBO1FBQ0EsTUFBQSxPQUFBLFdBQUEsb0JBQUEsU0FBQSxPQUFBO1VBQ0EsUUFBQSxLQUFBLGlCQUFBLENBQUEsQ0FBQTs7Ozs7O0FDVEE7R0FDQSxPQUFBLGdCQUFBOztHQUVBLE9BQUEsVUFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLEdBQUE7TUFDQSxJQUFBLEtBQUEsTUFBQTtRQUNBLE9BQUE7OztNQUdBLElBQUEsRUFBQSxRQUFBLFlBQUE7O01BRUEsSUFBQSxFQUFBLFNBQUEsR0FBQTtRQUNBLE9BQUE7OztNQUdBLElBQUEsS0FBQSxFQUFBLE1BQUE7O01BRUEsR0FBQSxPQUFBLEdBQUEsR0FBQTs7TUFFQSxJQUFBLEVBQUEsVUFBQSxHQUFBO1FBQ0EsR0FBQSxPQUFBLEdBQUEsR0FBQTs7O01BR0EsT0FBQSxHQUFBLEtBQUE7Ozs7QUN2QkE7R0FDQSxPQUFBLGFBQUE7R0FDQSxRQUFBLFlBQUEsWUFBQTtJQUNBLElBQUEsV0FBQSxVQUFBLE1BQUEsR0FBQTtNQUNBLE9BQUEsS0FBQSxnQkFBQSxLQUFBLEtBQUEsYUFBQSxLQUFBLElBQUEsS0FBQTs7O0lBR0EsT0FBQTtNQUNBLG1CQUFBLFVBQUEsTUFBQTtRQUNBLE9BQUEsU0FBQSxNQUFBOzs7TUFHQSxtQkFBQSxTQUFBLE1BQUE7UUFDQSxJQUFBLElBQUEsS0FBQTtRQUNBLElBQUEsSUFBQSxLQUFBOztRQUVBLElBQUEsSUFBQSxJQUFBO1VBQ0EsSUFBQSxNQUFBOzs7UUFHQSxJQUFBLElBQUEsSUFBQTtVQUNBLElBQUEsTUFBQTs7O1FBR0EsT0FBQSxDQUFBLFNBQUEsTUFBQSxNQUFBLElBQUEsTUFBQSxHQUFBLEtBQUE7Ozs7O0FDdkJBO0dBQ0EsT0FBQSxjQUFBO0dBQ0EsUUFBQSxTQUFBLFlBQUE7SUFDQSxPQUFBLFVBQUEsT0FBQTtNQUNBLE9BQUE7UUFDQSxLQUFBLFVBQUEsTUFBQSxNQUFBO1VBQ0EsT0FBQSxNQUFBLE1BQUEsS0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTthQUNBOztRQUVBLE1BQUEsVUFBQSxNQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsTUFBQSxLQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxVQUFBO2FBQ0E7O1FBRUEsTUFBQSxVQUFBLE1BQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxNQUFBLEtBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLFVBQUE7OztRQUdBLE1BQUEsVUFBQSxNQUFBO1VBQ0EsT0FBQSxNQUFBOztRQUVBLE9BQUEsVUFBQSxNQUFBLE1BQUE7VUFDQSxPQUFBLE1BQUEsTUFBQSxPQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxRQUFBLEtBQUEsV0FBQSxDQUFBOzs7Ozs7QUMxQkE7R0FDQSxPQUFBLG9CQUFBOztHQUVBLHlCQUFBLFNBQUEsZUFBQTtJQUNBLGNBQUEsYUFBQSxLQUFBOzs7SUFHQSxjQUFBLFNBQUEsUUFBQSxPQUFBLHNCQUFBOzs7R0FHQSxRQUFBLHdDQUFBLFNBQUEsSUFBQSxZQUFBO0lBQ0EsT0FBQTs7TUFFQSxXQUFBLFNBQUEsUUFBQTs7UUFFQSxJQUFBLE9BQUEsSUFBQSxRQUFBLFlBQUEsQ0FBQSxLQUFBLE9BQUEsSUFBQSxRQUFBLFdBQUEsQ0FBQSxHQUFBO1VBQ0EsT0FBQTs7O1FBR0EsT0FBQSxNQUFBLE9BQUEsTUFBQSxRQUFBLElBQUEsT0FBQTs7UUFFQSxPQUFBOzs7O01BSUEsZ0JBQUEsU0FBQSxXQUFBO1FBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7Ozs7OztNQVNBLFlBQUEsU0FBQSxVQUFBOztRQUVBLElBQUEsTUFBQTs7UUFFQSxJQUFBLFFBQUEsU0FBQSxTQUFBLE9BQUE7VUFDQSxPQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsU0FBQSxLQUFBOzs7OztVQUtBLElBQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7OztVQU1BLElBQUEsUUFBQSxNQUFBO1lBQ0EsU0FBQSxPQUFBOzs7Ozs7Ozs7UUFTQSxPQUFBOzs7O01BSUEsaUJBQUEsU0FBQSxXQUFBO1FBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7QUNwRUE7QUFDQSxRQUFBLE9BQUEsWUFBQSxJQUFBLENBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxJQUFBLGtCQUFBO0lBQ0EsTUFBQTtJQUNBLEtBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtJQUNBLE1BQUE7SUFDQSxPQUFBOztFQUVBLFNBQUEsTUFBQSxXQUFBO0lBQ0Esb0JBQUE7TUFDQSxTQUFBO1FBQ0E7UUFDQTs7TUFFQSxPQUFBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsU0FBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7TUFFQSxZQUFBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsY0FBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7TUFFQSxZQUFBO01BQ0EsWUFBQTtNQUNBLFVBQUE7TUFDQSxjQUFBO01BQ0EsY0FBQTtNQUNBLFNBQUE7TUFDQSxhQUFBO01BQ0EsYUFBQTs7SUFFQSxrQkFBQTtNQUNBLGdCQUFBO01BQ0EsZUFBQTtNQUNBLGFBQUE7TUFDQSxZQUFBLENBQUE7UUFDQSxTQUFBO1FBQ0EsVUFBQTtRQUNBLFdBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1NBQ0E7UUFDQSxTQUFBO1FBQ0EsVUFBQTtRQUNBLFdBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBOzs7SUFHQSxNQUFBO0lBQ0EsYUFBQSxTQUFBLEdBQUE7TUFDQSxPQUFBLGdCQUFBOzs7OztBQ3JHQTtHQUNBLE9BQUE7O0dBRUEsV0FBQSwySUFBQSxVQUFBLFFBQUEsWUFBQSxXQUFBLFVBQUEsU0FBQSxRQUFBLFVBQUEsWUFBQSxXQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7O0lBRUEsSUFBQSxZQUFBLEdBQUEsYUFBQTs7SUFFQSxHQUFBLFlBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxlQUFBLFlBQUEsS0FBQTs7OztJQUlBLEdBQUEsU0FBQTtJQUNBLEdBQUEsU0FBQTtJQUNBLEdBQUEsaUJBQUE7SUFDQSxHQUFBLGtCQUFBOztJQUVBLFNBQUEsU0FBQTtNQUNBLE9BQUE7U0FDQSxPQUFBO1VBQ0EsSUFBQSxHQUFBO1dBQ0E7VUFDQSxNQUFBLEdBQUEsS0FBQTtVQUNBLFVBQUEsR0FBQTtVQUNBLFFBQUEsR0FBQSxPQUFBLFFBQUEsWUFBQTtVQUNBLFdBQUEsR0FBQTtVQUNBLFNBQUEsR0FBQTtVQUNBLE1BQUEsR0FBQTtVQUNBLFNBQUEsR0FBQSxRQUFBO1VBQ0EsUUFBQTs7U0FFQTtTQUNBLEtBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7VUFFQSxTQUFBLFdBQUE7WUFDQSxXQUFBO2FBQ0E7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxnQkFBQSxRQUFBO01BQ0EsT0FBQTtNQUNBLE9BQUE7O01BRUEsR0FBQSxpQkFBQTs7O0lBR0EsU0FBQSxTQUFBO01BQ0E7U0FDQSxPQUFBO1VBQ0EsSUFBQSxHQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFNBQUEsV0FBQTtZQUNBLFdBQUE7YUFDQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7SUFJQSxTQUFBLGlCQUFBO01BQ0E7U0FDQSxPQUFBO1VBQ0EsSUFBQSxHQUFBO1dBQ0E7VUFDQSxRQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFdBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxZQUFBLFdBQUEsT0FBQTtNQUNBLEdBQUEsYUFBQSxZQUFBLEtBQUEsV0FBQTs7O0lBR0EsU0FBQSx1QkFBQTtNQUNBLEdBQUEsT0FBQSxvQkFBQSxTQUFBLGtCQUFBO1FBQ0EsSUFBQSxvQkFBQSxDQUFBLEdBQUEsVUFBQSxpQkFBQSxXQUFBO1VBQ0EsR0FBQSxrQkFBQSxJQUFBLEtBQUE7Ozs7TUFJQSxHQUFBLE9BQUEsbUJBQUEsU0FBQSxpQkFBQTtRQUNBLElBQUEsbUJBQUEsQ0FBQSxHQUFBLFVBQUEsZ0JBQUEsV0FBQTtVQUNBLEdBQUEsWUFBQSxTQUFBLGtCQUFBOzs7OztJQUtBLFNBQUEsb0JBQUE7TUFDQSxZQUFBLFFBQUEsR0FBQTtNQUNBLFlBQUEsV0FBQSxHQUFBOzs7Ozs7SUFNQSxJQUFBLGFBQUEsR0FBQTtNQUNBLE9BQUE7U0FDQTtTQUNBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxRQUFBLE9BQUEsSUFBQSxJQUFBOztVQUVBO1VBQ0E7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7OztJQUtBO09BQ0EsSUFBQTtRQUNBLElBQUE7O09BRUE7T0FDQSxLQUFBLFNBQUEsS0FBQTtRQUNBLFFBQUEsT0FBQSxJQUFBLElBQUE7O1FBRUEsSUFBQSxlQUFBLEdBQUEsVUFBQSxNQUFBOztRQUVBLEdBQUEsbUJBQUEsYUFBQTtRQUNBLEdBQUEsa0JBQUEsSUFBQSxLQUFBLEdBQUE7O1FBRUE7UUFDQTs7T0FFQSxNQUFBLFNBQUEsS0FBQTtRQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7OztBQ25KQTtHQUNBLE9BQUEscUJBQUEsQ0FBQTs7Q0FFQSxRQUFBLHlCQUFBLFNBQUEsT0FBQTtFQUNBLElBQUEsUUFBQTtJQUNBLE1BQUEsQ0FBQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsU0FBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsT0FBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsUUFBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsUUFBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsTUFBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBOzs7SUFHQSxRQUFBLENBQUE7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBOzs7SUFHQSxNQUFBLENBQUE7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7OztJQUdBLE1BQUEsQ0FBQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTs7O0lBR0EsTUFBQSxDQUFBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBO09BQ0E7TUFDQSxNQUFBO01BQ0EsT0FBQTtPQUNBO01BQ0EsTUFBQTtNQUNBLE9BQUE7T0FDQTtNQUNBLE1BQUE7TUFDQSxPQUFBOzs7O0VBSUEsT0FBQSxNQUFBOzs7QUM3S0E7R0FDQSxPQUFBLG9CQUFBLENBQUE7O0dBRUEsUUFBQSw0QkFBQSxVQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxTQUFBLFdBQUEsSUFBQTtNQUNBLE9BQUE7UUFDQSxTQUFBOzs7OztHQUtBLFFBQUEsMkJBQUEsVUFBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsU0FBQSxlQUFBO01BQ0EsSUFBQTtPQUNBO01BQ0EsUUFBQTtRQUNBLFFBQUE7Ozs7O0dBS0EsUUFBQSxpQ0FBQSxVQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxTQUFBLHNCQUFBO01BQ0EsSUFBQTs7OztHQUlBLFFBQUEsNEJBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsU0FBQSxZQUFBLElBQUE7TUFDQSxPQUFBO1FBQ0EsU0FBQTs7Ozs7R0FLQSxRQUFBLG1DQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFNBQUEsd0JBQUE7TUFDQSxJQUFBO09BQ0E7TUFDQSxRQUFBO1FBQ0EsUUFBQTs7Ozs7QUN2Q0E7R0FDQSxPQUFBOztHQUVBLFdBQUEsbUlBQUEsU0FBQSxRQUFBLFdBQUEsSUFBQSxRQUFBO0lBQ0EsWUFBQSxtQkFBQSxXQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7SUFDQSxJQUFBLE1BQUEsVUFBQTs7SUFFQSxHQUFBLFlBQUEsU0FBQSxJQUFBLGNBQUE7SUFDQSxHQUFBLFVBQUEsU0FBQSxJQUFBLFlBQUE7SUFDQSxHQUFBLFlBQUEsU0FBQSxJQUFBLGNBQUE7SUFDQSxHQUFBLFVBQUEsU0FBQSxJQUFBLFlBQUE7SUFDQSxHQUFBLFNBQUEsSUFBQSxVQUFBOztJQUVBLEdBQUEsU0FBQSxZQUFBLEtBQUEsVUFBQSxHQUFBO0lBQ0EsR0FBQSxjQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsT0FBQSxZQUFBLEtBQUEsUUFBQSxHQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsT0FBQSxZQUFBLEtBQUEsUUFBQSxHQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsU0FBQSxZQUFBLEtBQUEsVUFBQSxHQUFBO0lBQ0EsR0FBQSxjQUFBLFlBQUEsS0FBQTs7SUFFQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLFFBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQSxRQUFBLEdBQUE7O0lBRUEsR0FBQSxjQUFBO0lBQ0EsR0FBQSxjQUFBO0lBQ0EsR0FBQSxTQUFBO0lBQ0EsR0FBQSxnQkFBQTtJQUNBLEdBQUEsa0JBQUE7SUFDQSxHQUFBLGVBQUE7SUFDQSxHQUFBLFdBQUE7O0lBRUEsV0FBQSxVQUFBO0lBQ0EsV0FBQSxRQUFBO0lBQ0EsV0FBQSxRQUFBO0lBQ0EsV0FBQSxVQUFBOztJQUVBOztJQUVBLFNBQUEsUUFBQTtNQUNBLElBQUEsU0FBQTtRQUNBLE1BQUEsR0FBQTtRQUNBLE1BQUEsR0FBQTs7UUFFQSxXQUFBLEdBQUE7UUFDQSxTQUFBLEdBQUE7UUFDQSxXQUFBLEdBQUE7UUFDQSxTQUFBLEdBQUE7UUFDQSxRQUFBLEdBQUE7OztNQUdBLFVBQUEsT0FBQTs7TUFFQTtTQUNBLE1BQUE7U0FDQTtTQUNBLEtBQUEsU0FBQSxJQUFBO1VBQ0EsR0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBO1lBQ0EsS0FBQSxjQUFBLFlBQUEsS0FBQSxVQUFBLEtBQUE7OztVQUdBLEdBQUEsUUFBQSxHQUFBO1VBQ0EsR0FBQSxjQUFBLEdBQUE7O1VBRUEsSUFBQSxNQUFBLEdBQUEsY0FBQSxHQUFBO1VBQ0EsR0FBQSxhQUFBLEdBQUEsY0FBQSxHQUFBLFNBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQSxPQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOzs7O0lBSUEsR0FBQSxpQkFBQSxTQUFBLFNBQUEsT0FBQTtNQUNBLEdBQUEsUUFBQTs7O0lBR0EsU0FBQSxXQUFBLE1BQUEsT0FBQTtNQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsTUFBQTtRQUNBLEdBQUEsU0FBQSxLQUFBOzs7O0lBSUEsU0FBQSxZQUFBLElBQUE7TUFDQSxPQUFBO1NBQ0EsSUFBQTtVQUNBLElBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsT0FBQTtVQUNBLElBQUEsTUFBQSxXQUFBLEdBQUE7WUFDQSxJQUFBLFFBQUEsRUFBQSxVQUFBLEdBQUEsT0FBQSxTQUFBLE1BQUE7Y0FDQSxPQUFBLEtBQUEsT0FBQSxNQUFBOzs7WUFHQSxRQUFBLE1BQUE7O1lBRUEsTUFBQSxjQUFBLFlBQUEsS0FBQSxVQUFBLE1BQUE7WUFDQSxNQUFBLG1CQUFBOztZQUVBLEdBQUEsTUFBQSxPQUFBLE9BQUEsR0FBQTs7WUFFQSxPQUFBLEdBQUEsT0FBQTtjQUNBLEtBQUE7Ozs7Ozs7SUFPQSxTQUFBLGNBQUEsTUFBQTtNQUNBLElBQUEsaUJBQUEsV0FBQTtRQUNBLE9BQUE7V0FDQSxPQUFBO1lBQ0EsSUFBQSxLQUFBO2FBQ0E7WUFDQSxRQUFBOztXQUVBOzs7TUFHQSxPQUFBO1NBQ0EsS0FBQSxZQUFBLEtBQUE7U0FDQSxLQUFBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFVBQUEsSUFBQSxjQUFBLEtBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7OztJQUtBLFNBQUEsZ0JBQUEsTUFBQTtNQUNBLElBQUEsbUJBQUEsV0FBQTtRQUNBLElBQUEsc0JBQUEsT0FBQSxLQUFBO1VBQ0EsYUFBQTtVQUNBLFlBQUE7VUFDQSxVQUFBO1VBQ0EsU0FBQTtZQUNBLGFBQUEsV0FBQTtjQUNBLE9BQUE7Ozs7O1FBS0Esb0JBQUEsT0FBQSxLQUFBLFNBQUEsUUFBQTs7O1VBR0E7Ozs7TUFJQTtTQUNBLEtBQUEsWUFBQSxLQUFBO1NBQ0EsS0FBQTtTQUNBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7O01BR0EsT0FBQTs7OztJQUlBLFNBQUEsYUFBQSxNQUFBO01BQ0EsSUFBQSxtQkFBQSxPQUFBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTtRQUNBLFVBQUE7UUFDQSxTQUFBO1VBQ0EsYUFBQSxXQUFBO1lBQ0EsT0FBQTs7Ozs7TUFLQSxpQkFBQSxPQUFBLEtBQUEsU0FBQSxRQUFBOzs7UUFHQTs7Ozs7SUFLQSxTQUFBLFNBQUEsTUFBQTtNQUNBLElBQUEsUUFBQSxlQUFBO1FBQ0E7V0FDQSxPQUFBO1lBQ0EsSUFBQSxLQUFBOztXQUVBO1dBQ0EsS0FBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztZQUVBOztXQUVBLE1BQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7Ozs7O0lBTUEsU0FBQSxZQUFBLE1BQUE7TUFDQSxHQUFBLE9BQUE7TUFDQSxHQUFBLE9BQUE7O01BRUE7Ozs7SUFJQSxTQUFBLFlBQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7OztJQUlBLFNBQUEsU0FBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7Ozs7R0FLQSxXQUFBLDhHQUFBLFNBQUEsUUFBQSxXQUFBLFFBQUEsWUFBQSxtQkFBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBO0lBQ0EsSUFBQSxNQUFBLFVBQUE7O0lBRUEsR0FBQSxPQUFBLFNBQUEsSUFBQSxTQUFBO0lBQ0EsR0FBQSxPQUFBLFNBQUEsSUFBQSxTQUFBO0lBQ0EsR0FBQSxRQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsWUFBQSxZQUFBLEtBQUEsUUFBQSxHQUFBOztJQUVBLEdBQUEsY0FBQTtJQUNBLEdBQUEsY0FBQTtJQUNBLEdBQUEsV0FBQTs7SUFFQTs7SUFFQSxTQUFBLFFBQUE7TUFDQSxJQUFBLFNBQUE7UUFDQSxNQUFBLEdBQUE7UUFDQSxNQUFBLEdBQUE7UUFDQSxXQUFBOzs7TUFHQSxVQUFBLE9BQUE7O01BRUE7U0FDQSxNQUFBO1NBQ0E7U0FDQSxLQUFBLFNBQUEsSUFBQTtVQUNBLEdBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQTtZQUNBLEtBQUEsY0FBQSxZQUFBLEtBQUEsVUFBQSxLQUFBOzs7VUFHQSxHQUFBLFFBQUEsR0FBQTtVQUNBLEdBQUEsY0FBQSxHQUFBOztVQUVBLElBQUEsTUFBQSxHQUFBLGNBQUEsR0FBQTtVQUNBLEdBQUEsYUFBQSxHQUFBLGNBQUEsR0FBQSxTQUFBLElBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLEtBQUEsT0FBQTs7Ozs7SUFLQSxTQUFBLFNBQUEsTUFBQTtNQUNBLElBQUEsUUFBQSxlQUFBO1FBQ0E7V0FDQSxPQUFBO1lBQ0EsSUFBQSxLQUFBOztXQUVBO1dBQ0EsS0FBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztZQUVBOztXQUVBLE1BQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7Ozs7O0lBTUEsU0FBQSxZQUFBLE1BQUE7TUFDQSxHQUFBLE9BQUE7TUFDQSxHQUFBLE9BQUE7O01BRUE7Ozs7SUFJQSxTQUFBLFlBQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7Ozs7O0dBTUEsV0FBQSx1R0FBQSxTQUFBLFFBQUEsZ0JBQUEsUUFBQSxpQkFBQSxZQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7O0lBRUEsUUFBQSxPQUFBLElBQUE7O0lBRUEsR0FBQSxPQUFBO0lBQ0EsR0FBQSxRQUFBOztJQUVBLEdBQUEsU0FBQTtJQUNBLEdBQUEsV0FBQTs7SUFFQSxNQUFBOztJQUVBLFNBQUEsTUFBQSxNQUFBO01BQ0EsR0FBQSxPQUFBOztNQUVBO1NBQ0EsTUFBQTtVQUNBLE1BQUEsWUFBQTtVQUNBLE1BQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLEdBQUEsUUFBQSxJQUFBO1VBQ0EsR0FBQSxjQUFBLElBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBLFFBQUE7TUFDQSxHQUFBLGtCQUFBOztNQUVBO1NBQ0EsS0FBQTtVQUNBLElBQUEsWUFBQTtXQUNBO1VBQ0EsV0FBQSxPQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLGVBQUEsTUFBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLEdBQUEsa0JBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBO01BQ0EsZUFBQTs7Ozs7R0FLQSxXQUFBLHNGQUFBLFNBQUEsUUFBQSxnQkFBQSxRQUFBLFdBQUEsYUFBQTtJQUNBLElBQUEsS0FBQTs7SUFFQSxRQUFBLE9BQUEsSUFBQTs7SUFFQSxHQUFBLGVBQUE7SUFDQSxHQUFBLFNBQUE7O0lBRUEsU0FBQSxlQUFBO01BQ0EsR0FBQSxzQkFBQTs7TUFFQTtTQUNBLE9BQUE7VUFDQSxJQUFBLFlBQUE7V0FDQTtVQUNBLFFBQUEsR0FBQTs7U0FFQTtTQUNBLEtBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7VUFFQSxlQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsR0FBQSxzQkFBQTs7VUFFQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBO01BQ0EsZUFBQTs7Ozs7QUNqWkE7R0FDQSxPQUFBOztHQUVBLFdBQUEsNkVBQUEsVUFBQSxRQUFBLElBQUEsV0FBQSxVQUFBLFFBQUEsVUFBQTtJQUNBLElBQUEsS0FBQTs7SUFFQSxHQUFBLFFBQUE7O0lBRUEsU0FBQSxRQUFBO01BQ0EsT0FBQTtTQUNBLEtBQUE7VUFDQSxRQUFBLEdBQUE7VUFDQSxVQUFBLEdBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsTUFBQTtVQUNBLE9BQUEsUUFBQSxLQUFBLE9BQUE7O1VBRUEsU0FBQSxXQUFBO1lBQ0EsVUFBQSxJQUFBO2FBQ0E7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0FDdkJBO0dBQ0EsT0FBQSxtQkFBQSxDQUFBO0dBQ0EsUUFBQSwwQkFBQSxVQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxTQUFBO0tBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5bqU55So5YWl5Y+jXG4vLyBNb2R1bGU6IGd1bHVcbi8vIERlcGVuZGVuY2llczpcbi8vICAgIG5nUm91dGUsIGh0dHBJbnRlcmNlcHRvcnMsIGd1bHUubWlzc2luZ1xuXG4vKiBnbG9iYWwgZmFsbGJhY2tIYXNoICovXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ25nTG9jYWxlJyxcbiAgICAndG9hc3RyJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAnY3VzdG9tLmRpcmVjdGl2ZXMnLFxuICAgICdodHRwSW50ZXJjZXB0b3JzJyxcbiAgICAnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICd1dGlsLmZpbHRlcnMnLFxuICAgICd1dGlsLmRhdGUnLFxuICAgICdndWx1LmxvZ2luJyxcbiAgICAnZ3VsdS5jbGllbnRfc2VydmljZScsXG4gICAgJ2d1bHUubWlzc2luZydcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkc3RhdGVQcm92aWRlcikge1xuICAgIC8vIG5vdCB1c2UgaHRtbDUgaGlzdG9yeSBhcGlcbiAgICAvLyBidXQgdXNlIGhhc2hiYW5nXG4gICAgJGxvY2F0aW9uUHJvdmlkZXJcbiAgICAgIC5odG1sNU1vZGUoZmFsc2UpXG4gICAgICAuaGFzaFByZWZpeCgnIScpO1xuXG4gICAgLy8gZGVmaW5lIDQwNFxuICAgICR1cmxSb3V0ZXJQcm92aWRlclxuICAgICAgLm90aGVyd2lzZSgnL2xvZ2luJyk7XG5cbiAgICAvLyBBUEkgU2VydmVyXG4gICAgQVBJX1NFUlZFUlMgPSB7XG4gICAgICB0ZXN0ZXI6ICdodHRwOi8vYy5pZmRpdS5jb20nXG4gICAgICAvLyB0ZXN0ZXI6ICdodHRwOi8vby5kcDozMDAxJ1xuICAgIH07XG4gIH0pXG4gIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJGxvY2F0aW9uLCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xuICAgIHZhciByZWcgPSAvW1xcJlxcP11fPVxcZCsvO1xuXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XG4gICAgJHJvb3RTY29wZS4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XG5cbiAgICAvLyDnlKjkuo7ov5Tlm57kuIrlsYLpobXpnaJcbiAgICAkcm9vdFNjb3BlXG4gICAgICAuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJGxvY2F0aW9uLnVybCgpO1xuICAgICAgfSwgZnVuY3Rpb24oY3VycmVudCwgb2xkKSB7XG4gICAgICAgIGlmIChjdXJyZW50LnJlcGxhY2UocmVnLCAnJykgPT09IG9sZC5yZXBsYWNlKHJlZywgJycpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgJHJvb3RTY29wZS5iYWNrVXJsID0gb2xkO1xuICAgICAgfSk7XG5cbiAgICAkcm9vdFNjb3BlLmJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICRsb2NhdGlvbi51cmwoJHJvb3RTY29wZS5iYWNrVXJsKTtcbiAgICB9XG4gIH0pO1xuXG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuY2xpZW50X3NlcnZpY2UnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ2d1bHUuaW5kZW50J1xuICBdKVxuICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgnY2xpZW50X3NlcnZpY2UnLCB7XG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB1cmw6ICcvaW5kZW50cycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnY2xpZW50LXNlcnZpY2UvZGFzaGJvYXJkLmh0bSdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2NsaWVudF9zZXJ2aWNlLmxpc3QnLCB7XG4gICAgICAgIHVybDogJycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaW5kZW50L2xpc3QuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0luZGVudExpc3RDdHJsJ1xuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnY2xpZW50X3NlcnZpY2UuYXBwcm92YWwnLCB7XG4gICAgICAgIHVybDogJy9hcHByb3ZhbCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaW5kZW50L2xpc3RfYXBwcm92YWwuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0luZGVudEFwcHJvdmFsTGlzdEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdjbGllbnRfc2VydmljZS5pbmRlbnQnLCB7XG4gICAgICAgIHVybDogJy97aW5kZW50X2lkOlswLTldK30nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2luZGVudC9lZGl0Lmh0bScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdJbmRlbnRDdHJsJ1xuICAgICAgfSk7XG4gIH0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudCcsIFtcbiAgICAnZ3VsdS5pbmRlbnQuc3ZjcycsXG4gICAgJ2d1bHUuaW5kZW50LmVudW1zJ1xuICBdKTtcbiIsImFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5sb2dpbicsIFtcbiAgICAndWkucm91dGVyJyxcbiAgICAnZ3VsdS5sb2dpbi5zdmNzJ1xuICBdKVxuXG4gIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdsb2dpbi9sb2dpbi5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgICAgfSk7XG4gIH0pO1xuIiwiLy8gNDA0IOmhtemdolxuLy8gTW9kdWxlOiBndWx1Lm1pc3Npbmdcbi8vIERlcGVuZGVuY2llczogbmdSb3V0ZVxuXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUubWlzc2luZycsIFsndWkucm91dGVyJ10pXG5cbiAgLy8g6YWN572uIHJvdXRlXG4gIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgnbWlzc2luZycsIHtcbiAgICAgICAgdXJsOiAnL21pc3NpbmcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJzQwNC80MDQuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01pc3NpbmdDdHJsJ1xuICAgICAgfSk7XG4gIH0pXG5cbiAgLy8gNDA0IGNvbnRyb2xsZXJcbiAgLmNvbnRyb2xsZXIoJ01pc3NpbmdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgIGNvbnNvbGUubG9nKCdJYG0gaGVyZScpO1xuICAgIC8vIFRPRE86XG4gICAgLy8gMS4gc2hvdyBsYXN0IHBhdGggYW5kIHBhZ2UgbmFtZVxuICB9KTtcbiIsIi8vIOiHquWumuS5iSBkaXJlY3RpdmVzXG5cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnY3VzdG9tLmRpcmVjdGl2ZXMnLCBbXSlcbiAgLmRpcmVjdGl2ZSgnbmdJbmRldGVybWluYXRlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHNjb3BlLiR3YXRjaChhdHRyaWJ1dGVzWyduZ0luZGV0ZXJtaW5hdGUnXSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBlbGVtZW50LnByb3AoJ2luZGV0ZXJtaW5hdGUnLCAhIXZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ3V0aWwuZmlsdGVycycsIFtdKVxuXG4gIC5maWx0ZXIoJ21vYmlsZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzKSB7XG4gICAgICBpZiAocyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgcyA9IHMucmVwbGFjZSgvW1xcc1xcLV0rL2csICcnKTtcblxuICAgICAgaWYgKHMubGVuZ3RoIDwgMykge1xuICAgICAgICByZXR1cm4gcztcbiAgICAgIH1cblxuICAgICAgdmFyIHNhID0gcy5zcGxpdCgnJyk7XG5cbiAgICAgIHNhLnNwbGljZSgzLCAwLCAnLScpO1xuXG4gICAgICBpZiAocy5sZW5ndGggPj0gNykge1xuICAgICAgICBzYS5zcGxpY2UoOCwgMCwgJy0nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNhLmpvaW4oJycpO1xuICAgIH07XG4gIH0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCd1dGlsLmRhdGUnLCBbXSlcbiAgLmZhY3RvcnkoJ0RhdGVVdGlsJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciB0b1N0cmluZyA9IGZ1bmN0aW9uIChkYXRlLCBzKSB7XG4gICAgICByZXR1cm4gZGF0ZS5nZXRGdWxsWWVhcigpICsgcyArIChkYXRlLmdldE1vbnRoKCkgKyAxKSArIHMgKyBkYXRlLmdldERhdGUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9Mb2NhbERhdGVTdHJpbmc6IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgICAgIHJldHVybiB0b1N0cmluZyhkYXRlLCAnLScpO1xuICAgICAgfSxcblxuICAgICAgdG9Mb2NhbFRpbWVTdHJpbmc6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgdmFyIGggPSBkYXRlLmdldEhvdXJzKCk7XG4gICAgICAgIHZhciBtID0gZGF0ZS5nZXRNaW51dGVzKCk7XG5cbiAgICAgICAgaWYgKGggPCAxMCkge1xuICAgICAgICAgIGggPSAnMCcgKyBoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG0gPCAxMCkge1xuICAgICAgICAgIG0gPSAnMCcgKyBtO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFt0b1N0cmluZyhkYXRlLCAnLScpLCBoICsgJzonICsgbV0uam9pbignICcpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7IiwiLy8g5p6a5Li+IFNlcnZpY2VcbmFuZ3VsYXJcbiAgLm1vZHVsZSgndXRpbC5lbnVtcycsIFtdKVxuICAuZmFjdG9yeSgnRW51bXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChFTlVNUykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsOiBmdW5jdGlvbiAobmFtZSwgdGV4dCkge1xuICAgICAgICAgIHJldHVybiBFTlVNU1tuYW1lXS5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS50ZXh0ID09PSB0ZXh0O1xuICAgICAgICAgIH0pLnZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICB0ZXh0OiBmdW5jdGlvbiAobmFtZSwgdmFsKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZhbHVlID09PSB2YWw7XG4gICAgICAgICAgfSkudGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgaXRlbTogZnVuY3Rpb24gKG5hbWUsIHZhbCkge1xuICAgICAgICAgIHJldHVybiBFTlVNU1tuYW1lXS5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWx1ZSA9PT0gdmFsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBsaXN0OiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIHJldHVybiBFTlVNU1tuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgaXRlbXM6IGZ1bmN0aW9uIChuYW1lLCB2YWxzKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHMuaW5kZXhPZihpdGVtLnZhbHVlKSAhPT0gLTE7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcbiAgfSk7IiwiYW5ndWxhclxuICAubW9kdWxlKCdodHRwSW50ZXJjZXB0b3JzJywgW10pXG5cbiAgLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnaHR0cEludGVyY2VwdG9yJyk7XG4gICAgXG4gICAgLy8gQW5ndWxhciAkaHR0cCBpc27igJl0IGFwcGVuZGluZyB0aGUgaGVhZGVyIFgtUmVxdWVzdGVkLVdpdGggPSBYTUxIdHRwUmVxdWVzdCBzaW5jZSBBbmd1bGFyIDEuMy4wXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbltcIlgtUmVxdWVzdGVkLVdpdGhcIl0gPSAnWE1MSHR0cFJlcXVlc3QnO1xuICB9KVxuXG4gIC5mYWN0b3J5KCdodHRwSW50ZXJjZXB0b3InLCBmdW5jdGlvbigkcSwgJHJvb3RTY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICAvLyDor7fmsYLliY3kv67mlLkgcmVxdWVzdCDphY3nva5cbiAgICAgICdyZXF1ZXN0JzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIC8vIOiLpeivt+axgueahOaYr+aooeadv++8jOaIluW3suWKoOS4iuaXtumXtOaIs+eahCB1cmwg5Zyw5Z2A77yM5YiZ5LiN6ZyA6KaB5Yqg5pe26Ze05oizXG4gICAgICAgIGlmIChjb25maWcudXJsLmluZGV4T2YoJy5odG0nKSAhPT0gLTEgfHwgY29uZmlnLnVybC5pbmRleE9mKCc/Xz0nKSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLnVybCA9IGNvbmZpZy51cmwgKyAnP189JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICB9LFxuXG4gICAgICAvLyDor7fmsYLlh7rplJnvvIzkuqTnu5kgZXJyb3IgY2FsbGJhY2sg5aSE55CGXG4gICAgICAncmVxdWVzdEVycm9yJzogZnVuY3Rpb24ocmVqZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIOWTjeW6lOaVsOaNruaMiee6puWumuWkhOeQhlxuICAgICAgLy8ge1xuICAgICAgLy8gICBjb2RlOiAyMDAsIC8vIOiHquWumuS5ieeKtuaAgeegge+8jDIwMCDmiJDlip/vvIzpnZ4gMjAwIOWdh+S4jeaIkOWKn1xuICAgICAgLy8gICBtc2c6ICfmk43kvZzmj5DnpLonLCAvLyDkuI3og73lkowgZGF0YSDlhbHlrZhcbiAgICAgIC8vICAgZGF0YToge30gLy8g55So5oi35pWw5o2uXG4gICAgICAvLyB9XG4gICAgICAncmVzcG9uc2UnOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyDmnI3liqHnq6/ov5Tlm57nmoTmnInmlYjnlKjmiLfmlbDmja5cbiAgICAgICAgdmFyIGRhdGEsIGNvZGU7XG5cbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNPYmplY3QocmVzcG9uc2UuZGF0YSkpIHtcbiAgICAgICAgICBjb2RlID0gcmVzcG9uc2UuZGF0YS5jb2RlO1xuICAgICAgICAgIGRhdGEgPSByZXNwb25zZS5kYXRhLmRhdGE7XG5cbiAgICAgICAgICAvLyDoi6Ugc3RhdHVzIDIwMCwg5LiUIGNvZGUgITIwMO+8jOWImei/lOWbnueahOaYr+aTjeS9nOmUmeivr+aPkOekuuS/oeaBr1xuICAgICAgICAgIC8vIOmCo+S5iO+8jGNhbGxiYWNrIOS8muaOpeaUtuWIsOS4i+mdouW9ouW8j+eahOWPguaVsO+8mlxuICAgICAgICAgIC8vIHsgY29kZTogMjAwMDEsIG1zZzogJ+aTjeS9nOWksei0pScgfVxuICAgICAgICAgIGlmIChjb2RlICE9PSAyMDApIHtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOiLpeacjeWKoeerr+i/lOWbnueahCBkYXRhICFudWxs77yM5YiZ6L+U5Zue55qE5piv5pyJ5pWI5Zyw55So5oi35pWw5o2uXG4gICAgICAgICAgLy8g6YKj5LmI77yMY2FsbGJhY2sg5Lya5o6l5pS25Yiw5LiL6Z2i5b2i5byP5Y+C5pWw77yaXG4gICAgICAgICAgLy8geyBpdGVtczogWy4uLl0sIHRvdGFsX2NvdW50OiAxMDAgfVxuICAgICAgICAgIGlmIChkYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOiLpeacjeWKoeerr+i/lOWbnueahCBkYXRhIOWAvOS4uiBudWxs77yM5YiZ6L+U5Zue55qE5piv5o+Q56S65L+h5oGvXG4gICAgICAgICAgLy8g6YKj5LmIIGNhbGxiYWNrIOS8muaOpeaUtuWIsOS4i+mdouW9ouW8j+eahOWPguaVsO+8mlxuICAgICAgICAgIC8vIHsgY29kZTogMjAwLCBtc2c6ICfmk43kvZzmiJDlip8nIH1cbiAgICAgICAgICAvLyDpu5jorqTkuLrmraRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIOWTjeW6lOWHuumUme+8jOS6pOe7mSBlcnJvciBjYWxsYmFjayDlpITnkIZcbiAgICAgICdyZXNwb25zZUVycm9yJzogZnVuY3Rpb24ocmVqZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTsiLCIndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZShcIm5nTG9jYWxlXCIsIFtdLCBbXCIkcHJvdmlkZVwiLCBmdW5jdGlvbigkcHJvdmlkZSkge1xuICB2YXIgUExVUkFMX0NBVEVHT1JZID0ge1xuICAgIFpFUk86IFwiemVyb1wiLFxuICAgIE9ORTogXCJvbmVcIixcbiAgICBUV086IFwidHdvXCIsXG4gICAgRkVXOiBcImZld1wiLFxuICAgIE1BTlk6IFwibWFueVwiLFxuICAgIE9USEVSOiBcIm90aGVyXCJcbiAgfTtcbiAgJHByb3ZpZGUudmFsdWUoXCIkbG9jYWxlXCIsIHtcbiAgICBcIkRBVEVUSU1FX0ZPUk1BVFNcIjoge1xuICAgICAgXCJBTVBNU1wiOiBbXG4gICAgICAgIFwiXFx1NGUwYVxcdTUzNDhcIixcbiAgICAgICAgXCJcXHU0ZTBiXFx1NTM0OFwiXG4gICAgICBdLFxuICAgICAgXCJEQVlcIjogW1xuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NjVlNVwiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NGUwMFwiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NGU4Y1wiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NGUwOVwiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NTZkYlwiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NGU5NFwiLFxuICAgICAgICBcIlxcdTY2MWZcXHU2NzFmXFx1NTE2ZFwiXG4gICAgICBdLFxuICAgICAgXCJNT05USFwiOiBbXG4gICAgICAgIFwiMVxcdTY3MDhcIixcbiAgICAgICAgXCIyXFx1NjcwOFwiLFxuICAgICAgICBcIjNcXHU2NzA4XCIsXG4gICAgICAgIFwiNFxcdTY3MDhcIixcbiAgICAgICAgXCI1XFx1NjcwOFwiLFxuICAgICAgICBcIjZcXHU2NzA4XCIsXG4gICAgICAgIFwiN1xcdTY3MDhcIixcbiAgICAgICAgXCI4XFx1NjcwOFwiLFxuICAgICAgICBcIjlcXHU2NzA4XCIsXG4gICAgICAgIFwiMTBcXHU2NzA4XCIsXG4gICAgICAgIFwiMTFcXHU2NzA4XCIsXG4gICAgICAgIFwiMTJcXHU2NzA4XCJcbiAgICAgIF0sXG4gICAgICBcIlNIT1JUREFZXCI6IFtcbiAgICAgICAgXCJcXHU1NDY4XFx1NjVlNVwiLFxuICAgICAgICBcIlxcdTU0NjhcXHU0ZTAwXCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTRlOGNcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NGUwOVwiLFxuICAgICAgICBcIlxcdTU0NjhcXHU1NmRiXCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTRlOTRcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NTE2ZFwiXG4gICAgICBdLFxuICAgICAgXCJTSE9SVE1PTlRIXCI6IFtcbiAgICAgICAgXCIxXFx1NjcwOFwiLFxuICAgICAgICBcIjJcXHU2NzA4XCIsXG4gICAgICAgIFwiM1xcdTY3MDhcIixcbiAgICAgICAgXCI0XFx1NjcwOFwiLFxuICAgICAgICBcIjVcXHU2NzA4XCIsXG4gICAgICAgIFwiNlxcdTY3MDhcIixcbiAgICAgICAgXCI3XFx1NjcwOFwiLFxuICAgICAgICBcIjhcXHU2NzA4XCIsXG4gICAgICAgIFwiOVxcdTY3MDhcIixcbiAgICAgICAgXCIxMFxcdTY3MDhcIixcbiAgICAgICAgXCIxMVxcdTY3MDhcIixcbiAgICAgICAgXCIxMlxcdTY3MDhcIlxuICAgICAgXSxcbiAgICAgIFwiZnVsbERhdGVcIjogXCJ5XFx1NWU3NE1cXHU2NzA4ZFxcdTY1ZTVFRUVFXCIsXG4gICAgICBcImxvbmdEYXRlXCI6IFwieVxcdTVlNzRNXFx1NjcwOGRcXHU2NWU1XCIsXG4gICAgICBcIm1lZGl1bVwiOiBcInl5eXktTS1kIGFoOm1tOnNzXCIsXG4gICAgICBcIm1lZGl1bURhdGVcIjogXCJ5eXl5LU0tZFwiLFxuICAgICAgXCJtZWRpdW1UaW1lXCI6IFwiYWg6bW06c3NcIixcbiAgICAgIFwic2hvcnRcIjogXCJ5eS1NLWQgYWg6bW1cIixcbiAgICAgIFwic2hvcnREYXRlXCI6IFwieXktTS1kXCIsXG4gICAgICBcInNob3J0VGltZVwiOiBcImFoOm1tXCJcbiAgICB9LFxuICAgIFwiTlVNQkVSX0ZPUk1BVFNcIjoge1xuICAgICAgXCJDVVJSRU5DWV9TWU1cIjogXCJcXHUwMGE1XCIsXG4gICAgICBcIkRFQ0lNQUxfU0VQXCI6IFwiLlwiLFxuICAgICAgXCJHUk9VUF9TRVBcIjogXCIsXCIsXG4gICAgICBcIlBBVFRFUk5TXCI6IFt7XG4gICAgICAgIFwiZ1NpemVcIjogMyxcbiAgICAgICAgXCJsZ1NpemVcIjogMyxcbiAgICAgICAgXCJtYWNGcmFjXCI6IDAsXG4gICAgICAgIFwibWF4RnJhY1wiOiAzLFxuICAgICAgICBcIm1pbkZyYWNcIjogMCxcbiAgICAgICAgXCJtaW5JbnRcIjogMSxcbiAgICAgICAgXCJuZWdQcmVcIjogXCItXCIsXG4gICAgICAgIFwibmVnU3VmXCI6IFwiXCIsXG4gICAgICAgIFwicG9zUHJlXCI6IFwiXCIsXG4gICAgICAgIFwicG9zU3VmXCI6IFwiXCJcbiAgICAgIH0sIHtcbiAgICAgICAgXCJnU2l6ZVwiOiAzLFxuICAgICAgICBcImxnU2l6ZVwiOiAzLFxuICAgICAgICBcIm1hY0ZyYWNcIjogMCxcbiAgICAgICAgXCJtYXhGcmFjXCI6IDIsXG4gICAgICAgIFwibWluRnJhY1wiOiAyLFxuICAgICAgICBcIm1pbkludFwiOiAxLFxuICAgICAgICBcIm5lZ1ByZVwiOiBcIihcXHUwMGE0XCIsXG4gICAgICAgIFwibmVnU3VmXCI6IFwiKVwiLFxuICAgICAgICBcInBvc1ByZVwiOiBcIlxcdTAwYTRcIixcbiAgICAgICAgXCJwb3NTdWZcIjogXCJcIlxuICAgICAgfV1cbiAgICB9LFxuICAgIFwiaWRcIjogXCJ6aC1jblwiLFxuICAgIFwicGx1cmFsQ2F0XCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgIHJldHVybiBQTFVSQUxfQ0FURUdPUlkuT1RIRVI7XG4gICAgfVxuICB9KTtcbn1dKTtcbiIsImFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5pbmRlbnQnKVxuICBcbiAgLmNvbnRyb2xsZXIoJ0luZGVudEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkbG9jYXRpb24sICR0aW1lb3V0LCAkZmlsdGVyLCB0b2FzdHIsIERhdGVVdGlsLCBJbmRlbnRzU3ZjLCBJbmRlbnRTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuXG4gICAgdmFyIGluZGVudF9pZCA9IHZtLiRzdGF0ZVBhcmFtcy5pbmRlbnRfaWQ7XG5cbiAgICB2bS50eXBlX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCd0eXBlJyk7XG4gICAgdm0uY2hhbm5lbF9saXN0ID0gSW5kZW50RW51bXMubGlzdCgnY2hhbm5lbCcpO1xuICAgIC8vIHZtLmJyYW5kX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdicmFuZCcpO1xuICAgIC8vIHZtLnNlcmllc19saXN0ID0gSW5kZW50RW51bXMubGlzdCgnc2VyaWVzJyk7XG5cbiAgICB2bS5zdWJtaXQgPSBzdWJtaXQ7XG4gICAgdm0uY2FuY2VsID0gY2FuY2VsO1xuICAgIHZtLmNhbmNlbF9jb25maXJtID0gY2FuY2VsX2NvbmZpcm07XG4gICAgdm0ub3Blbl9kYXRlcGlja2VyID0gb3Blbl9kYXRlcGlja2VyO1xuXG4gICAgZnVuY3Rpb24gc3VibWl0KCkge1xuICAgICAgcmV0dXJuIEluZGVudFN2Y1xuICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICBpZDogdm0uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6IHZtLnR5cGUudmFsdWUsXG4gICAgICAgICAgcmVzZXJ2ZXI6IHZtLnJlc2VydmVyLFxuICAgICAgICAgIG1vYmlsZTogdm0ubW9iaWxlLnJlcGxhY2UoL1tcXHNcXC1dKy9nLCAnJyksXG4gICAgICAgICAgdGVzdF90aW1lOiB2bS50ZXN0X3RpbWUsXG4gICAgICAgICAgYWRkcmVzczogdm0uYWRkcmVzcyxcbiAgICAgICAgICBtZW1vOiB2bS5tZW1vLFxuICAgICAgICAgIGNoYW5uZWw6IHZtLmNoYW5uZWwudmFsdWUsXG4gICAgICAgICAgc3RhdHVzOiAyXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICfpooTnuqbljZXnoa7orqTlubbnlJ/mlYjmiJDlip8nKTtcblxuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5iYWNrKCk7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn6aKE57qm5Y2V56Gu6K6k5bm255Sf5pWI5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5fZGF0ZXBpY2tlcigkZXZlbnQpIHtcbiAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICB2bS50ZXN0X3RpbWVfb3BlbiA9IHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgICAgSW5kZW50U3ZjXG4gICAgICAgIC5yZW1vdmUoe1xuICAgICAgICAgIGlkOiB2bS5pZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5Y+W5raI6aKE57qm5Y2V5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuYmFjaygpO1xuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+WPlua2iOmihOe6puWNleWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWxfY29uZmlybSgpIHtcbiAgICAgIEluZGVudFN2Y1xuICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICBpZDogdm0uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIHN0YXR1czogMVxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5bey5Y+W5raI56Gu6K6k6K6i5Y2VJyk7XG5cbiAgICAgICAgICAkcm9vdFNjb3BlLmJhY2soKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICflj5bmtojnoa7orqTorqLljZXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0X2l0ZW0obGlzdF9uYW1lLCB2YWx1ZSkge1xuICAgICAgdm1bbGlzdF9uYW1lXSA9IEluZGVudEVudW1zLml0ZW0obGlzdF9uYW1lLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2F0Y2hfdGVzdF90aW1lX3BhcnQoKSB7XG4gICAgICB2bS4kd2F0Y2goJ3Rlc3RfdGltZV9iZWZvcmUnLCBmdW5jdGlvbih0ZXN0X3RpbWVfYmVmb3JlKSB7XG4gICAgICAgIGlmICh0ZXN0X3RpbWVfYmVmb3JlICYmICF2bS5lZGl0X2Zvcm0udGVzdF90aW1lX2JlZm9yZS4kcHJpc3RpbmUpIHtcbiAgICAgICAgICB2bS50ZXN0X3RpbWVfYWZ0ZXIgPSBuZXcgRGF0ZSh0ZXN0X3RpbWVfYmVmb3JlKTsgIFxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdm0uJHdhdGNoKCd0ZXN0X3RpbWVfYWZ0ZXInLCBmdW5jdGlvbih0ZXN0X3RpbWVfYWZ0ZXIpIHtcbiAgICAgICAgaWYgKHRlc3RfdGltZV9hZnRlciAmJiAhdm0uZWRpdF9mb3JtLnRlc3RfdGltZV9hZnRlci4kcHJpc3RpbmUpIHtcbiAgICAgICAgICB2bS50ZXN0X3RpbWUgPSBEYXRlVXRpbC50b0xvY2FsVGltZVN0cmluZyh0ZXN0X3RpbWVfYWZ0ZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRfc2VsZWN0ZWRfaXRlbSgpIHtcbiAgICAgIHNlbGVjdF9pdGVtKCd0eXBlJywgdm0udHlwZSk7XG4gICAgICBzZWxlY3RfaXRlbSgnY2hhbm5lbCcsIHZtLmNoYW5uZWwpO1xuICAgICAgLy8gc2VsZWN0X2l0ZW0oJ2JyYW5kJywgdm0uY2FyLmJyYW5kKTtcbiAgICAgIC8vIHNlbGVjdF9pdGVtKCdzZXJpZXMnLCB2bS5jYXIuc2VyaWVzKTtcbiAgICB9XG5cbiAgICAvLyDmlrDlu7rpooTnuqbljZVcbiAgICBpZiAoaW5kZW50X2lkID09IDApIHtcbiAgICAgIHJldHVybiBJbmRlbnRzU3ZjXG4gICAgICAgIC5zYXZlKClcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHZtLCByZXMudG9KU09OKCkpO1xuXG4gICAgICAgICAgc2V0X3NlbGVjdGVkX2l0ZW0oKTtcbiAgICAgICAgICB3YXRjaF90ZXN0X3RpbWVfcGFydCgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+aWsOW7uumihOe6puWNleWksei0pe+8jOivt+WIt+aWsOmHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDoi6Xmm7TmlrDpooTnuqbljZXvvIzliJnojrflj5bpooTnuqbljZXkv6Hmga9cbiAgICBJbmRlbnRTdmNcbiAgICAgIC5nZXQoe1xuICAgICAgICBpZDogaW5kZW50X2lkXG4gICAgICB9KVxuICAgICAgLiRwcm9taXNlXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgYW5ndWxhci5leHRlbmQodm0sIHJlcy50b0pTT04oKSk7XG5cbiAgICAgICAgdmFyIHRlc3RfdGltZV9zcCA9IHZtLnRlc3RfdGltZS5zcGxpdCgnICcpO1xuXG4gICAgICAgIHZtLnRlc3RfdGltZV9iZWZvcmUgPSB0ZXN0X3RpbWVfc3BbMF07XG4gICAgICAgIHZtLnRlc3RfdGltZV9hZnRlciA9IG5ldyBEYXRlKHZtLnRlc3RfdGltZSk7XG5cbiAgICAgICAgc2V0X3NlbGVjdGVkX2l0ZW0oKTtcbiAgICAgICAgd2F0Y2hfdGVzdF90aW1lX3BhcnQoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfojrflj5borqLljZXkv6Hmga/lpLHotKXvvIzor7fliLfmlrDph43or5UnKTtcbiAgICAgIH0pO1xuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuaW5kZW50LmVudW1zJywgWyd1dGlsLmVudW1zJ10pXG5cbi5mYWN0b3J5KCdJbmRlbnRFbnVtcycsIGZ1bmN0aW9uKEVudW1zKSB7XG4gIHZhciBFTlVNUyA9IHtcbiAgICB0eXBlOiBbe1xuICAgICAgdGV4dDogJ+WFqOmDqCcsXG4gICAgICB2YWx1ZTogMFxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfmo4DmtYsnLFxuICAgICAgdmFsdWU6IDFcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn6LSo5L+dJyxcbiAgICAgIHZhbHVlOiAyXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+e7tOS/ricsXG4gICAgICB2YWx1ZTogM1xuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfkv53lhbsnLFxuICAgICAgdmFsdWU6IDRcbiAgICB9XSxcblxuICAgIGNoYW5uZWw6IFt7XG4gICAgICB0ZXh0OiAn5YWo6YOoJyxcbiAgICAgIHZhbHVlOiAwXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+WVhuWuticsXG4gICAgICB2YWx1ZTogMVxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfkuKrkuronLFxuICAgICAgdmFsdWU6IDJcbiAgICB9XSxcblxuICAgIGJyYW5kOiBbe1xuICAgICAgdGV4dDogJ+WFqOmDqCcsXG4gICAgICB2YWx1ZTogMFxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICflpaXov6onLFxuICAgICAgdmFsdWU6IDFcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5aWU6amwJyxcbiAgICAgIHZhbHVlOiAyXG4gICAgfV0sXG5cbiAgICBzZXJpZXM6IFt7XG4gICAgICB0ZXh0OiAn5YWo6YOoJyxcbiAgICAgIHZhbHVlOiAwXG4gICAgfSwge1xuICAgICAgdGV4dDogJ0ExJyxcbiAgICAgIHZhbHVlOiAxXG4gICAgfSwge1xuICAgICAgdGV4dDogJ0EyJyxcbiAgICAgIHZhbHVlOiAyXG4gICAgfV0sXG5cbiAgICBzdGF0dXM6IFt7XG4gICAgICB0ZXh0OiAn5YWo6YOoJyxcbiAgICAgIHZhbHVlOiAwXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+W+heWuouacjeehruiupCcsXG4gICAgICB2YWx1ZTogMVxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICflvoXnlJ/mlYgnLFxuICAgICAgdmFsdWU6IDEwMDFcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5b6F5a6i5pyN5YiG6YWN5qOA5rWL5biIJyxcbiAgICAgIHZhbHVlOiAyXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+WuouacjeWuoeaguOWPlua2iCcsXG4gICAgICB2YWx1ZTogM1xuICAgIH0sIHtcbiAgICAgIHRleHQ6ICflvoXmo4DmtYvluIjnoa7orqQnLFxuICAgICAgdmFsdWU6IDRcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5b6F5qOA5rWLJyxcbiAgICAgIHZhbHVlOiA1XG4gICAgfSwge1xuICAgICAgdGV4dDogJ+ajgOa1i+W4iOajgOa1i+S4rScsXG4gICAgICB2YWx1ZTogNlxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICflt7Llj5bmtognLFxuICAgICAgdmFsdWU6IDdcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5b6F5oql5ZGKJyxcbiAgICAgIHZhbHVlOiA4XG4gICAgfSwge1xuICAgICAgdGV4dDogJ+W3suWPkeW4g+aKpeWRiicsXG4gICAgICB2YWx1ZTogOVxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICflt7Llj5HluIPkvZzkuJonLFxuICAgICAgdmFsdWU6IDEwXG4gICAgfV0sXG5cbiAgICBjaXR5OiBbe1xuICAgICAgdGV4dDogJ+WFqOmDqCcsXG4gICAgICB2YWx1ZTogMFxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfopb/lroknLFxuICAgICAgdmFsdWU6IDFcbiAgICB9XSxcblxuICAgIHRlc3RlcjogW3tcbiAgICAgIHRleHQ6ICflhajpg6gnLFxuICAgICAgdmFsdWU6IDBcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5byg5biI5YKFJyxcbiAgICAgIHZhbHVlOiAxXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+iDoeW4iOWChScsXG4gICAgICB2YWx1ZTogMlxuICAgIH1dLFxuXG4gICAgcm9sZTogW3tcbiAgICAgIHRleHQ6ICflhajpg6gnLFxuICAgICAgdmFsdWU6IDBcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5a6i5pyNJyxcbiAgICAgIHZhbHVlOiAxXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+ajgOa1i+W4iCcsXG4gICAgICB2YWx1ZTogMlxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfnvJbovpEnLFxuICAgICAgdmFsdWU6IDNcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn5aKe5YC86aG+6ZeuJyxcbiAgICAgIHZhbHVlOiA0XG4gICAgfSwge1xuICAgICAgdGV4dDogJ+e7tOS/ruW4iCcsXG4gICAgICB2YWx1ZTogNVxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfluK7kubDluIgnLFxuICAgICAgdmFsdWU6IDZcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn566h55CG5ZGYJyxcbiAgICAgIHZhbHVlOiA3XG4gICAgfV0sXG5cbiAgICBmcm9tOiBbe1xuICAgICAgdGV4dDogJ+WFqOmDqCcsXG4gICAgICB2YWx1ZTogMFxuICAgIH0sIHtcbiAgICAgIHRleHQ6ICfmnaXnlLUnLFxuICAgICAgdmFsdWU6IDFcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAn572R56uZJyxcbiAgICAgIHZhbHVlOiAyXG4gICAgfSwge1xuICAgICAgdGV4dDogJ+W+ruS/oScsXG4gICAgICB2YWx1ZTogM1xuICAgIH0sIHtcbiAgICAgIHRleHQ6ICc1OOmAmuW4uCcsXG4gICAgICB2YWx1ZTogNFxuICAgIH1dLFxuXG4gICAgc2l6ZTogW3tcbiAgICAgIHRleHQ6IDEwLFxuICAgICAgdmFsdWU6IDEwXG4gICAgfSwge1xuICAgICAgdGV4dDogMTUsXG4gICAgICB2YWx1ZTogMTVcbiAgICB9LCB7XG4gICAgICB0ZXh0OiAyMCxcbiAgICAgIHZhbHVlOiAyMFxuICAgIH0sIHtcbiAgICAgIHRleHQ6IDUwLFxuICAgICAgdmFsdWU6IDUwXG4gICAgfSwge1xuICAgICAgdGV4dDogMTAwLFxuICAgICAgdmFsdWU6IDEwMFxuICAgIH1dXG4gIH07XG5cbiAgcmV0dXJuIEVudW1zKEVOVU1TKTtcbn0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudC5zdmNzJywgWyduZ1Jlc291cmNlJ10pXG4gIFxuICAuc2VydmljZSgnSW5kZW50c1N2YycsIGZ1bmN0aW9uICgkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLnRlc3RlciArICcvb3JkZXJzJywge30sIHtcbiAgICAgIHF1ZXJ5OiB7XG4gICAgICAgIGlzQXJyYXk6IGZhbHNlXG4gICAgICB9XG4gICAgfSk7XG4gIH0pXG5cbiAgLnNlcnZpY2UoJ0luZGVudFN2YycsIGZ1bmN0aW9uICgkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLnRlc3RlciArICcvb3JkZXJzLzppZCcsIHtcbiAgICAgIGlkOiAnQGlkJ1xuICAgIH0sIHtcbiAgICAgIHVwZGF0ZToge1xuICAgICAgICBtZXRob2Q6ICdQVVQnXG4gICAgICB9XG4gICAgfSk7XG4gIH0pXG5cbiAgLnNlcnZpY2UoJ0luZGVudFRlc3RlclN2YycsIGZ1bmN0aW9uICgkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLnRlc3RlciArICcvb3JkZXJzLzppZC90ZXN0ZXInLCB7XG4gICAgICBpZDogJ0BpZCdcbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnVGVzdGVyc1N2YycsIGZ1bmN0aW9uKCRyZXNvdXJjZSkge1xuICAgIHJldHVybiAkcmVzb3VyY2UoQVBJX1NFUlZFUlMudGVzdGVyICsgJy90ZXN0ZXJzJywge30sIHtcbiAgICAgIHF1ZXJ5OiB7XG4gICAgICAgIGlzQXJyYXk6IGZhbHNlXG4gICAgICB9XG4gICAgfSk7XG4gIH0pXG5cbiAgLnNlcnZpY2UoJ0luZGVudEFwcHJvdmFsU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy50ZXN0ZXIgKyAnL29yZGVycy86aWQvYXBwcm92YWwnLCB7XG4gICAgICBpZDogJ0BpZCdcbiAgICB9LCB7XG4gICAgICB1cGRhdGU6IHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgfVxuICAgIH0pO1xuICB9KTsiLCIvKiBnbG9iYWwgYW5ndWxhciAqL1xuYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudCcpXG4gIFxuICAuY29udHJvbGxlcignSW5kZW50TGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRsb2NhdGlvbiwgJHEsIHRvYXN0ciwgJG1vZGFsLFxuICAgIEluZGVudHNTdmMsIEluZGVudEFwcHJvdmFsU3ZjLCBJbmRlbnRTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuICAgIHZhciBxc28gPSAkbG9jYXRpb24uc2VhcmNoKCk7XG5cbiAgICB2bS5zdGF0dXNfaWQgPSBwYXJzZUludChxc28uc3RhdHVzX2lkKSB8fCAwO1xuICAgIHZtLmNpdHlfaWQgPSBwYXJzZUludChxc28uY2l0eV9pZCkgfHwgMDtcbiAgICB2bS50ZXN0ZXJfaWQgPSBwYXJzZUludChxc28udGVzdGVyX2lkKSB8fCAwO1xuICAgIHZtLnJvbGVfaWQgPSBwYXJzZUludChxc28ucm9sZV9pZCkgfHwgMDtcbiAgICB2bS5tb2JpbGUgPSBxc28ubW9iaWxlIHx8ICcnO1xuXG4gICAgdm0uc3RhdHVzID0gSW5kZW50RW51bXMuaXRlbSgnc3RhdHVzJywgdm0uc3RhdHVzX2lkKTtcbiAgICB2bS5zdGF0dXNfbGlzdCA9IEluZGVudEVudW1zLmxpc3QoJ3N0YXR1cycpO1xuICAgIHZtLmNpdHkgPSBJbmRlbnRFbnVtcy5pdGVtKCdjaXR5Jywgdm0uY2l0eV9pZCk7XG4gICAgdm0uY2l0eV9saXN0ID0gSW5kZW50RW51bXMubGlzdCgnY2l0eScpO1xuICAgIHZtLnJvbGUgPSBJbmRlbnRFbnVtcy5pdGVtKCdyb2xlJywgdm0ucm9sZV9pZCk7XG4gICAgdm0ucm9sZV9saXN0ID0gSW5kZW50RW51bXMubGlzdCgncm9sZScpO1xuICAgIHZtLnRlc3RlciA9IEluZGVudEVudW1zLml0ZW0oJ3Rlc3RlcicsIHZtLnRlc3Rlcl9pZCk7XG4gICAgdm0udGVzdGVyX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCd0ZXN0ZXInKTtcblxuICAgIHZtLnBhZ2UgPSBwYXJzZUludChxc28ucGFnZSkgfHwgMTtcbiAgICB2bS5zaXplID0gcGFyc2VJbnQocXNvLnNpemUpIHx8IDIwO1xuICAgIHZtLnNpemVzID0gSW5kZW50RW51bXMubGlzdCgnc2l6ZScpO1xuICAgIHZtLnNpemVfaXRlbSA9IEluZGVudEVudW1zLml0ZW0oJ3NpemUnLCB2bS5zaXplKTtcblxuICAgIHZtLnNpemVfY2hhbmdlID0gc2l6ZV9jaGFuZ2U7XG4gICAgdm0ucGFnZV9jaGFuZ2UgPSBwYWdlX2NoYW5nZTtcbiAgICB2bS5zZWFyY2ggPSBzZWFyY2g7XG4gICAgdm0uY29uZmlybV9vcmRlciA9IGNvbmZpcm1fb3JkZXI7XG4gICAgdm0uZGlzcGF0Y2hfdGVzdGVyID0gZGlzcGF0Y2hfdGVzdGVyO1xuICAgIHZtLmNhbmNlbF9vcmRlciA9IGNhbmNlbF9vcmRlcjtcbiAgICB2bS5hcHByb3ZhbCA9IGFwcHJvdmFsO1xuXG4gICAgd2F0Y2hfbGlzdCgnc3RhdHVzJywgJ3N0YXR1c19pZCcpO1xuICAgIHdhdGNoX2xpc3QoJ2NpdHknLCAnY2l0eV9pZCcpO1xuICAgIHdhdGNoX2xpc3QoJ3JvbGUnLCAncm9sZV9pZCcpO1xuICAgIHdhdGNoX2xpc3QoJ3Rlc3RlcicsICd0ZXN0ZXJfaWQnKTtcblxuICAgIHF1ZXJ5KCk7XG5cbiAgICBmdW5jdGlvbiBxdWVyeSgpIHtcbiAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgIHNpemU6IHZtLnNpemUsXG4gICAgICAgIHBhZ2U6IHZtLnBhZ2UsXG5cbiAgICAgICAgc3RhdHVzX2lkOiB2bS5zdGF0dXNfaWQsXG4gICAgICAgIGNpdHlfaWQ6IHZtLmNpdHlfaWQsXG4gICAgICAgIHRlc3Rlcl9pZDogdm0udGVzdGVyX2lkLFxuICAgICAgICByb2xlX2lkOiB2bS5yb2xlX2lkLFxuICAgICAgICBtb2JpbGU6IHZtLm1vYmlsZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJGxvY2F0aW9uLnNlYXJjaChwYXJhbXMpO1xuXG4gICAgICBJbmRlbnRzU3ZjXG4gICAgICAgIC5xdWVyeShwYXJhbXMpXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihycykge1xuICAgICAgICAgIHJzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zdGF0dXNfdGV4dCA9IEluZGVudEVudW1zLnRleHQoJ3N0YXR1cycsIGl0ZW0uc3RhdHVzKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZtLml0ZW1zID0gcnMuaXRlbXM7XG4gICAgICAgICAgdm0udG90YWxfY291bnQgPSBycy50b3RhbF9jb3VudDtcblxuICAgICAgICAgIHZhciB0bXAgPSBycy50b3RhbF9jb3VudCAvIHZtLnNpemU7XG4gICAgICAgICAgdm0ucGFnZV9jb3VudCA9IHJzLnRvdGFsX2NvdW50ICUgdm0uc2l6ZSA9PT0gMCA/IHRtcCA6IChNYXRoLmZsb29yKHRtcCkgKyAxKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMuZGF0YS5tc2cgfHwgJ+afpeivouWksei0pe+8jOacjeWKoeWZqOWPkeeUn+acquefpemUmeivr++8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2bS4kd2F0Y2hDb2xsZWN0aW9uKCdpdGVtcycsIGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICB2bS5pdGVtcyA9IGl0ZW1zO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gd2F0Y2hfbGlzdChuYW1lLCBmaWVsZCkge1xuICAgICAgdm0uJHdhdGNoKG5hbWUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdm1bZmllbGRdID0gaXRlbS52YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZldGNoX29yZGVyKGlkKSB7XG4gICAgICByZXR1cm4gSW5kZW50U3ZjXG4gICAgICAgIC5nZXQoe1xuICAgICAgICAgIGlkOiBpZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgICBpZiAob3JkZXIuc3RhdHVzICE9PSAxKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBfLmZpbmRJbmRleCh2bS5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZCA9PT0gb3JkZXIuaWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgb3JkZXIgPSBvcmRlci50b0pTT04oKTtcblxuICAgICAgICAgICAgb3JkZXIuc3RhdHVzX3RleHQgPSBJbmRlbnRFbnVtcy50ZXh0KCdzdGF0dXMnLCBvcmRlci5zdGF0dXMpO1xuICAgICAgICAgICAgb3JkZXIuY29uZmlybV9ieV9vdGhlciA9IHRydWU7XG5cbiAgICAgICAgICAgIHZtLml0ZW1zLnNwbGljZShpbmRleCwgMSwgb3JkZXIpO1xuXG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHtcbiAgICAgICAgICAgICAgbXNnOiAn6K+l6K6i5Y2V5bey6KKr5YW25LuW5a6i5pyN56Gu6K6kJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDnoa7orqTorqLljZVcbiAgICBmdW5jdGlvbiBjb25maXJtX29yZGVyKGl0ZW0pIHtcbiAgICAgIHZhciBfY29uZmlybV9vcmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSW5kZW50U3ZjXG4gICAgICAgICAgLnVwZGF0ZSh7XG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHN0YXR1czogMTAwMVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLiRwcm9taXNlO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuICRxXG4gICAgICAgIC53aGVuKGZldGNoX29yZGVyKGl0ZW0uaWQpKVxuICAgICAgICAudGhlbihfY29uZmlybV9vcmRlcilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5bey56Gu6K6k6K+l6K6i5Y2VJyk7XG5cbiAgICAgICAgICAkbG9jYXRpb24udXJsKCcvaW5kZW50cy8nICsgaXRlbS5pZCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn56Gu6K6k6K+l6K6i5Y2V5aSx6LSlJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWIhumFjeajgOa1i+W4iFxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoX3Rlc3RlcihpdGVtKSB7XG4gICAgICB2YXIgX2Rpc3BhdGNoX3Rlc3RlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGlzcGF0Y2hfdGVzdGVyX2lucyA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2luZGVudC9kaXNwYXRjaF90ZXN0ZXIuaHRtJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnRGlzcGF0Y2hDdHJsJyxcbiAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgaW5kZW50X2luZm86IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRpc3BhdGNoX3Rlc3Rlcl9pbnMucmVzdWx0LnRoZW4oZnVuY3Rpb24odGVzdGVyKSB7XG4gICAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgICAvLyDmm7TmlrDpooTnuqbljZXnirbmgIFcbiAgICAgICAgICBxdWVyeSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgJHFcbiAgICAgICAgLndoZW4oZmV0Y2hfb3JkZXIoaXRlbS5pZCkpXG4gICAgICAgIC50aGVuKF9kaXNwYXRjaF90ZXN0ZXIpXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5YiG6YWN5qOA5rWL5biI5aSx6LSlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8g5Y+W5raI6K6i5Y2VXG4gICAgZnVuY3Rpb24gY2FuY2VsX29yZGVyKGl0ZW0pIHtcbiAgICAgIHZhciBjYW5jZWxfb3JkZXJfaW5zID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ2luZGVudC9jYW5jZWxfb3JkZXIuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhbmNlbE9yZGVyQ3RybCcsXG4gICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgIGluZGVudF9pbmZvOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNhbmNlbF9vcmRlcl9pbnMucmVzdWx0LnRoZW4oZnVuY3Rpb24odGVzdGVyKSB7XG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vIOabtOaWsOmihOe6puWNleeKtuaAgVxuICAgICAgICBxdWVyeSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5a6h5qC45Y+W5raIXG4gICAgZnVuY3Rpb24gYXBwcm92YWwoaXRlbSkge1xuICAgICAgaWYgKGNvbmZpcm0oJ+ehruiupOWQjOaEj+WPlua2iOivpeiuouWNle+8nycpKSB7XG4gICAgICAgIEluZGVudEFwcHJvdmFsU3ZjXG4gICAgICAgICAgLnVwZGF0ZSh7XG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLiRwcm9taXNlXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICflkIzmhI/lj5bmtojor6XorqLljZXvvIzmk43kvZzmiJDlip8nKTtcblxuICAgICAgICAgICAgcXVlcnkoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfmj5DkuqTlpLHotKXvvIzor7fph43or5UnKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmr4/pobXmnaHmlbDmlLnlj5hcbiAgICBmdW5jdGlvbiBzaXplX2NoYW5nZShzaXplKSB7XG4gICAgICB2bS5zaXplID0gc2l6ZTtcbiAgICAgIHZtLnBhZ2UgPSAxO1xuXG4gICAgICBxdWVyeSgpO1xuICAgIH1cblxuICAgIC8vIOe/u+mhtVxuICAgIGZ1bmN0aW9uIHBhZ2VfY2hhbmdlKHBhZ2UpIHtcbiAgICAgIHZtLnBhZ2UgPSBwYWdlO1xuXG4gICAgICBxdWVyeSgpO1xuICAgIH1cblxuICAgIC8vIOafpeivouaPkOS6pFxuICAgIGZ1bmN0aW9uIHNlYXJjaCgpIHtcbiAgICAgIHZtLnBhZ2UgPSAxO1xuXG4gICAgICBxdWVyeSgpO1xuICAgIH1cbiAgfSlcbiAgXG4gIC8vIOW+heWuoeaJueWIl+ihqFxuICAuY29udHJvbGxlcignSW5kZW50QXBwcm92YWxMaXN0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGxvY2F0aW9uLCB0b2FzdHIsIEluZGVudHNTdmMsIEluZGVudEFwcHJvdmFsU3ZjLCBJbmRlbnRFbnVtcykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcbiAgICB2YXIgcXNvID0gJGxvY2F0aW9uLnNlYXJjaCgpO1xuICAgIFxuICAgIHZtLnBhZ2UgPSBwYXJzZUludChxc28ucGFnZSkgfHwgMTtcbiAgICB2bS5zaXplID0gcGFyc2VJbnQocXNvLnNpemUpIHx8IDIwO1xuICAgIHZtLnNpemVzID0gSW5kZW50RW51bXMubGlzdCgnc2l6ZScpO1xuICAgIHZtLnNpemVfaXRlbSA9IEluZGVudEVudW1zLml0ZW0oJ3NpemUnLCB2bS5zaXplKTtcblxuICAgIHZtLnNpemVfY2hhbmdlID0gc2l6ZV9jaGFuZ2U7XG4gICAgdm0ucGFnZV9jaGFuZ2UgPSBwYWdlX2NoYW5nZTtcbiAgICB2bS5hcHByb3ZhbCA9IGFwcHJvdmFsO1xuXG4gICAgcXVlcnkoKTtcblxuICAgIGZ1bmN0aW9uIHF1ZXJ5KCkge1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgc2l6ZTogdm0uc2l6ZSxcbiAgICAgICAgcGFnZTogdm0ucGFnZSxcbiAgICAgICAgc3RhdHVzX2lkOiAzXG4gICAgICB9O1xuICAgICAgXG4gICAgICAkbG9jYXRpb24uc2VhcmNoKHBhcmFtcyk7XG5cbiAgICAgIEluZGVudHNTdmNcbiAgICAgICAgLnF1ZXJ5KHBhcmFtcylcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJzKSB7XG4gICAgICAgICAgcnMuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnN0YXR1c190ZXh0ID0gSW5kZW50RW51bXMudGV4dCgnc3RhdHVzJywgaXRlbS5zdGF0dXMpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdm0uaXRlbXMgPSBycy5pdGVtcztcbiAgICAgICAgICB2bS50b3RhbF9jb3VudCA9IHJzLnRvdGFsX2NvdW50O1xuXG4gICAgICAgICAgdmFyIHRtcCA9IHJzLnRvdGFsX2NvdW50IC8gdm0uc2l6ZTtcbiAgICAgICAgICB2bS5wYWdlX2NvdW50ID0gcnMudG90YWxfY291bnQgJSB2bS5zaXplID09PSAwID8gdG1wIDogKE1hdGguZmxvb3IodG1wKSArIDEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5kYXRhLm1zZyB8fCAn5p+l6K+i5aSx6LSl77yM5pyN5Yqh5Zmo5Y+R55Sf5pyq55+l6ZSZ6K+v77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWuoeaguOWPlua2iFxuICAgIGZ1bmN0aW9uIGFwcHJvdmFsKGl0ZW0pIHtcbiAgICAgIGlmIChjb25maXJtKCfnoa7orqTlkIzmhI/lj5bmtojor6XorqLljZXvvJ8nKSkge1xuICAgICAgICBJbmRlbnRBcHByb3ZhbFN2Y1xuICAgICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KVxuICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5ZCM5oSP5Y+W5raI6K+l6K6i5Y2V77yM5pON5L2c5oiQ5YqfJyk7XG5cbiAgICAgICAgICAgIHF1ZXJ5KCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5o+Q5Lqk5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5q+P6aG15p2h5pWw5pS55Y+YXG4gICAgZnVuY3Rpb24gc2l6ZV9jaGFuZ2Uoc2l6ZSkge1xuICAgICAgdm0uc2l6ZSA9IHNpemU7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDnv7vpobVcbiAgICBmdW5jdGlvbiBwYWdlX2NoYW5nZShwYWdlKSB7XG4gICAgICB2bS5wYWdlID0gcGFnZTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgfSlcblxuICAvLyDliIbphY3mo4DmtYvluIhcbiAgLmNvbnRyb2xsZXIoJ0Rpc3BhdGNoQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UsIHRvYXN0ciwgSW5kZW50VGVzdGVyU3ZjLCBUZXN0ZXJzU3ZjLCBpbmRlbnRfaW5mbykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcblxuICAgIGFuZ3VsYXIuZXh0ZW5kKHZtLCBpbmRlbnRfaW5mbyk7XG5cbiAgICB2bS5wYWdlID0gMTtcbiAgICB2bS5xdWVyeSA9IHF1ZXJ5O1xuXG4gICAgdm0uY2FuY2VsID0gY2FuY2VsO1xuICAgIHZtLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5cbiAgICBxdWVyeSgxKTtcblxuICAgIGZ1bmN0aW9uIHF1ZXJ5KHBhZ2UpIHtcbiAgICAgIHZtLnBhZ2UgPSBwYWdlO1xuXG4gICAgICBUZXN0ZXJzU3ZjXG4gICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgdGltZTogaW5kZW50X2luZm8udGVzdF90aW1lLFxuICAgICAgICAgIHBhZ2U6IHBhZ2VcbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHZtLml0ZW1zID0gcmVzLml0ZW1zO1xuICAgICAgICAgIHZtLnRvdGFsX2NvdW50ID0gcmVzLnRvdGFsX2NvdW50O1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+iOt+WPluepuuaho+acn+ajgOa1i+W4iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwYXRjaCh0ZXN0ZXIpIHtcbiAgICAgIHZtLmRpc3BhdGNoX3N0YXR1cyA9IHRydWU7XG5cbiAgICAgIEluZGVudFRlc3RlclN2Y1xuICAgICAgICAuc2F2ZSh7XG4gICAgICAgICAgaWQ6IGluZGVudF9pbmZvLmlkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0ZXN0ZXJfaWQ6IHRlc3Rlci5pZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5YiG6YWN5qOA5rWL5biI5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSh0ZXN0ZXIpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdm0uZGlzcGF0Y2hfc3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+WIhumFjeajgOa1i+W4iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gICAgfVxuICB9KVxuICBcbiAgLy8g5Y+W5raI6K6i5Y2VXG4gIC5jb250cm9sbGVyKCdDYW5jZWxPcmRlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRtb2RhbEluc3RhbmNlLCB0b2FzdHIsIEluZGVudFN2YywgaW5kZW50X2luZm8pIHtcbiAgICB2YXIgdm0gPSAkc2NvcGU7XG5cbiAgICBhbmd1bGFyLmV4dGVuZCh2bSwgaW5kZW50X2luZm8pO1xuXG4gICAgdm0uY2FuY2VsX29yZGVyID0gY2FuY2VsX29yZGVyO1xuICAgIHZtLmNhbmNlbCA9IGNhbmNlbDtcblxuICAgIGZ1bmN0aW9uIGNhbmNlbF9vcmRlcigpIHtcbiAgICAgIHZtLmNhbmNlbF9vcmRlcl9zdGF0dXMgPSB0cnVlO1xuXG4gICAgICBJbmRlbnRTdmNcbiAgICAgICAgLnJlbW92ZSh7XG4gICAgICAgICAgaWQ6IGluZGVudF9pbmZvLmlkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICByZWFzb246IHZtLnJlYXNvblxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn6K6i5Y2V5Y+W5raI5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdm0uY2FuY2VsX29yZGVyX3N0YXR1cyA9IGZhbHNlO1xuXG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+iuouWNleWPlua2iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gICAgfVxuICB9KTtcblxuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmxvZ2luJylcbiAgXG4gIC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkcSwgJGxvY2F0aW9uLCAkdGltZW91dCwgdG9hc3RyLCBMb2dpblN2Yykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcblxuICAgIHZtLmxvZ2luID0gbG9naW47XG5cbiAgICBmdW5jdGlvbiBsb2dpbigpIHtcbiAgICAgIHJldHVybiBMb2dpblN2Y1xuICAgICAgICAuc2F2ZSh7XG4gICAgICAgICAgam9iX25vOiB2bS5qb2Jfbm8sXG4gICAgICAgICAgcGFzc3dvcmQ6IHZtLnBhc3N3b3JkXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MoZGF0YS5tc2cgfHwgJ+eZu+W9leaIkOWKn++8jOato+WcqOS4uuS9oOi3s+i9rC4uLicpO1xuXG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkbG9jYXRpb24udXJsKCcvaW5kZW50cycpO1xuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+eZu+W9leWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH0pOyIsImFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5sb2dpbi5zdmNzJywgWyduZ1Jlc291cmNlJ10pXG4gIC5zZXJ2aWNlKCdMb2dpblN2YycsIGZ1bmN0aW9uICgkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLnRlc3RlciArICcvdXNlci9sb2dpbicpO1xuICB9KSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==