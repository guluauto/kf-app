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
      // cservice: 'http://cs.guluabc.com'
      cservice: 'http://cs.guluabc.com'
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
        templateUrl: 'client-service/dashboard.htm',
        resolve: {
          IndentEnums: 'IndentEnums'
        }
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
  
  .controller('IndentCtrl', ["$scope", "$rootScope", "$location", "$timeout", "$filter", "toastr", "DateUtil", "IndentsSvc", "IndentCreateSvc", "IndentUnreachSvc", "IndentSvc", "IndentValidateSvc", "IndentEnums", function($scope, $rootScope, $location, $timeout,
    $filter, toastr, DateUtil, IndentsSvc, IndentCreateSvc, IndentUnreachSvc, IndentSvc,
    IndentValidateSvc, IndentEnums) {
    var vm = $scope;

    var indent_id = vm.$stateParams.indent_id;

    vm.type_list = IndentEnums.list('order_type');
    vm.channel_list = IndentEnums.list('channel');
    // vm.brand_list = IndentEnums.list('brand');
    // vm.series_list = IndentEnums.list('series');

    vm.submit = submit;
    vm.cancel = cancel;
    vm.cancel_confirm = cancel_confirm;
    vm.open_datepicker = open_datepicker;

    function submit() {
      return IndentValidateSvc
        .update({
          id: vm.id
        }, {
          type_id: vm.order_type.value,
          requester: {
            name: vm.requester_name,
            mobile: vm.requester_mobile.replace(/[\s\-]+/g, '')
          },
          appointment_time: vm.appointment_time,
          address: vm.address,
          memo: vm.memo,
          // channel: vm.channel.value
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

      vm.appointment_time_open = true;
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
      IndentUnreachSvc
        .update({
          id: vm.id
        }, {
          memo: vm.memo
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

    function watch_appointment_time_part() {
      vm.$watch('appointment_time_before', function(appointment_time_before) {
        if (appointment_time_before && !vm.edit_form.appointment_time_before.$pristine) {
          vm.appointment_time_after = new Date(appointment_time_before);  
        }
      });

      vm.$watch('appointment_time_after', function(appointment_time_after) {
        if (appointment_time_after && !vm.edit_form.appointment_time_after.$pristine) {
          vm.appointment_time = DateUtil.toLocalTimeString(appointment_time_after);
        }
      });
    }

    function set_selected_item() {
      select_item('order_type', vm.type_id);
      select_item('channel', vm.channel);
      // select_item('brand', vm.car.brand);
      // select_item('series', vm.car.series);
    }
    function handler(res) {
      angular.extend(vm, res.toJSON());

      var appointment_time_sp = vm.appointment_time.split(' ');

      vm.appointment_time_before = appointment_time_sp[0];
      vm.appointment_time_after = new Date(vm.appointment_time);

      vm.requester_name = vm.requester.name;
      vm.requester_mobile = vm.requester.mobile;

      set_selected_item();
      watch_appointment_time_part();
    }

    // 新建预约单
    if (indent_id == 0) {
      return IndentCreateSvc
        .save()
        .$promise
        .then(handler)
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
      .then(handler)
      .catch(function(res) {
        toastr.error(res.msg || '获取订单信息失败，请刷新重试');
      });
  }]);
angular
  .module('gulu.indent.enums', ['util.enums', 'gulu.indent.svcs'])

  .factory('IndentEnums', ["Enums", "IndentEnumsSvc", "toastr", function(Enums, IndentEnumsSvc, toastr) {
    return IndentEnumsSvc
      .get()
      .$promise
      .then(function(res) {
        var all_preins = 'order_type channel brand series status city inspector role from'.split(' ');

        all_preins.forEach(function(key) {
          res[key].unshift({
            text: '全部',
            value: null
          });
        });

        return Enums(res.toJSON());
      })
      .catch(function(res) {
        toastr.error(res.msg || '获取枚举失败');
      });
  }]);

angular
  .module('gulu.indent.svcs', ['ngResource'])

  .service('IndentEnumsSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/enums');
  }])
  
  .service('IndentsSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/orders', {}, {
      query: {
        isArray: false
      }
    });
  }])

  .service('IndentCreateSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order');
  }])

  .service('IndentSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order/:id', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }])

  .service('IndentAssertSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order/:id/asserted', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }])

  .service('IndentValidateSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order/:id/validated', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }])

  .service('IndentUnreachSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order/:id/unreachable', {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    })
  }])

  .service('IndentTesterSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/order/:id/assigned', {
      inspector_id: '@inspector_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }])

  .service('TestersSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/account/inspectors/idle', {}, {
      query: {
        isArray: false
      }
    });
  }])

  .service('IndentRevokeSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/orders/:id/revoked', {
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
  
  .controller('IndentListCtrl', ["$scope", "$location", "$q", "toastr", "$modal", "IndentsSvc", "IndentRevokeSvc", "IndentAssertSvc", "IndentSvc", "IndentEnums", function($scope, $location, $q, toastr, $modal,
    IndentsSvc, IndentRevokeSvc, IndentAssertSvc, IndentSvc, IndentEnums) {
    var vm = $scope;
    var qso = $location.search();

    vm.status_id = parseInt(qso.status_id) || null;
    vm.city_id = parseInt(qso.city_id) || null;
    vm.inspector_id = parseInt(qso.inspector_id) || null;
    // vm.role_id = parseInt(qso.role_id) || null;
    vm.requester_mobile = qso.requester_mobile || null;

    vm.status = IndentEnums.item('status', vm.status_id);
    vm.status_list = IndentEnums.list('status');
    vm.city = IndentEnums.item('city', vm.city_id);
    vm.city_list = IndentEnums.list('city');
    // vm.role = IndentEnums.item('role', vm.role_id);
    // vm.role_list = IndentEnums.list('role');
    vm.inspector = IndentEnums.item('inspector', vm.inspector_id);
    vm.inspector_list = IndentEnums.list('inspector');

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

    query();

    function query() {
      var params = {
        items_page: vm.size,
        page: vm.page,

        status_id: vm.status_id,
        city_id: vm.city_id,
        inspector_id: vm.inspector_id,
        // role_id: vm.role_id,
        requester_mobile: vm.requester_mobile
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.status_text = IndentEnums.text('status', item.status_id);
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

    watch_list('status', 'status_id');
    watch_list('city', 'city_id');
    // watch_list('role', 'role_id');
    watch_list('inspector', 'inspector_id');

    function watch_list(name, field) {
      vm.$watch(name, function(item) {
        if (!item) {
          return;
        }

        vm[field] = item.value;
      });
    }

    // 确认订单
    function confirm_order(item) {
      IndentAssertSvc
        .update({
          id: item.id
        })
        .$promise
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

      dispatch_tester_ins.result.then(function() {
        query();
      });
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
        IndentRevokeSvc
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
  .controller('IndentApprovalListCtrl', ["$scope", "$location", "toastr", "IndentsSvc", "IndentRevokeSvc", "IndentEnums", function($scope, $location, toastr, IndentsSvc, IndentRevokeSvc, IndentEnums) {
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
        items_page: vm.size,
        page: vm.page,
        status_id: 3
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.status_text = IndentEnums.text('status', item.status_id);
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
        IndentRevokeSvc
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
        .update({
          id: indent_info.id
        }, {
          inspector_id: tester.id
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
          username: vm.job_no,
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
    return $resource(API_SERVERS.tester + '/staff_login');
  }])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNsaWVudC1zZXJ2aWNlL2NsaWVudF9zZXJ2aWNlX21vZHVsZS5qcyIsImluZGVudC9pbmRlbnRfbW9kdWxlLmpzIiwibG9naW4vbG9naW5fbW9kdWxlLmpzIiwiNDA0LzQwNF9jdHJsLmpzIiwiY29tcG9uZW50L2N1c3RvbS1kaXJlY3RpdmUuanMiLCJjb21wb25lbnQvY3VzdG9tLWZpbHRlci5qcyIsImNvbXBvbmVudC9kYXRlLmpzIiwiY29tcG9uZW50L2VudW1zLmpzIiwiY29tcG9uZW50L2h0dHAuanMiLCJjb21wb25lbnQvemgtY24uanMiLCJpbmRlbnQvZWRpdF9jdHJsLmpzIiwiaW5kZW50L2VudW1zLmpzIiwiaW5kZW50L2luZGVudF9zdmNzLmpzIiwiaW5kZW50L2xpc3RfY3RybC5qcyIsImxvZ2luL2xvZ2luX2N0cmwuanMiLCJsb2dpbi9sb2dpbl9zdmNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUFNQTtHQUNBLE9BQUEsUUFBQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTs7R0FFQSxxRUFBQSxTQUFBLG1CQUFBLG9CQUFBLGdCQUFBOzs7SUFHQTtPQUNBLFVBQUE7T0FDQSxXQUFBOzs7SUFHQTtPQUNBLFVBQUE7OztJQUdBLGNBQUE7O01BRUEsVUFBQTs7O0dBR0EsMERBQUEsU0FBQSxZQUFBLFdBQUEsUUFBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBOztJQUVBLFdBQUEsU0FBQTtJQUNBLFdBQUEsZUFBQTs7O0lBR0E7T0FDQSxPQUFBLFdBQUE7UUFDQSxPQUFBLFVBQUE7U0FDQSxTQUFBLFNBQUEsS0FBQTtRQUNBLElBQUEsUUFBQSxRQUFBLEtBQUEsUUFBQSxJQUFBLFFBQUEsS0FBQSxLQUFBO1VBQ0E7OztRQUdBLFdBQUEsVUFBQTs7O0lBR0EsV0FBQSxPQUFBLFdBQUE7TUFDQSxVQUFBLElBQUEsV0FBQTs7Ozs7QUN6REE7R0FDQSxPQUFBLHVCQUFBO0lBQ0E7SUFDQTs7R0FFQSwwQkFBQSxTQUFBLGdCQUFBO0lBQ0E7T0FDQSxNQUFBLGtCQUFBO1FBQ0EsVUFBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsU0FBQTtVQUNBLGFBQUE7OztPQUdBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7O09BRUEsTUFBQSwyQkFBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7T0FFQSxNQUFBLHlCQUFBO1FBQ0EsS0FBQTtRQUNBLGFBQUE7UUFDQSxZQUFBOzs7O0FDNUJBO0dBQ0EsT0FBQSxlQUFBO0lBQ0E7SUFDQTs7O0FDSEE7R0FDQSxPQUFBLGNBQUE7SUFDQTtJQUNBOzs7R0FHQSwwQkFBQSxTQUFBLGdCQUFBO0lBQ0E7T0FDQSxNQUFBLFNBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7Ozs7Ozs7O0FDUEE7R0FDQSxPQUFBLGdCQUFBLENBQUE7OztHQUdBLDBCQUFBLFVBQUEsZ0JBQUE7SUFDQTtPQUNBLE1BQUEsV0FBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7Ozs7R0FLQSxXQUFBLDBCQUFBLFVBQUEsUUFBQTtJQUNBLFFBQUEsSUFBQTs7Ozs7OztBQ2pCQTtHQUNBLE9BQUEscUJBQUE7R0FDQSxVQUFBLGdDQUFBLFNBQUEsVUFBQTtJQUNBLE9BQUE7TUFDQSxVQUFBO01BQ0EsTUFBQSxTQUFBLE9BQUEsU0FBQSxZQUFBO1FBQ0EsTUFBQSxPQUFBLFdBQUEsb0JBQUEsU0FBQSxPQUFBO1VBQ0EsUUFBQSxLQUFBLGlCQUFBLENBQUEsQ0FBQTs7Ozs7O0FDVEE7R0FDQSxPQUFBLGdCQUFBOztHQUVBLE9BQUEsVUFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLEdBQUE7TUFDQSxJQUFBLEtBQUEsTUFBQTtRQUNBLE9BQUE7OztNQUdBLElBQUEsRUFBQSxRQUFBLFlBQUE7O01BRUEsSUFBQSxFQUFBLFNBQUEsR0FBQTtRQUNBLE9BQUE7OztNQUdBLElBQUEsS0FBQSxFQUFBLE1BQUE7O01BRUEsR0FBQSxPQUFBLEdBQUEsR0FBQTs7TUFFQSxJQUFBLEVBQUEsVUFBQSxHQUFBO1FBQ0EsR0FBQSxPQUFBLEdBQUEsR0FBQTs7O01BR0EsT0FBQSxHQUFBLEtBQUE7Ozs7QUN2QkE7R0FDQSxPQUFBLGFBQUE7R0FDQSxRQUFBLFlBQUEsWUFBQTtJQUNBLElBQUEsV0FBQSxVQUFBLE1BQUEsR0FBQTtNQUNBLE9BQUEsS0FBQSxnQkFBQSxLQUFBLEtBQUEsYUFBQSxLQUFBLElBQUEsS0FBQTs7O0lBR0EsT0FBQTtNQUNBLG1CQUFBLFVBQUEsTUFBQTtRQUNBLE9BQUEsU0FBQSxNQUFBOzs7TUFHQSxtQkFBQSxTQUFBLE1BQUE7UUFDQSxJQUFBLElBQUEsS0FBQTtRQUNBLElBQUEsSUFBQSxLQUFBOztRQUVBLElBQUEsSUFBQSxJQUFBO1VBQ0EsSUFBQSxNQUFBOzs7UUFHQSxJQUFBLElBQUEsSUFBQTtVQUNBLElBQUEsTUFBQTs7O1FBR0EsT0FBQSxDQUFBLFNBQUEsTUFBQSxNQUFBLElBQUEsTUFBQSxHQUFBLEtBQUE7Ozs7O0FDdkJBO0dBQ0EsT0FBQSxjQUFBO0dBQ0EsUUFBQSxTQUFBLFlBQUE7SUFDQSxPQUFBLFVBQUEsT0FBQTtNQUNBLE9BQUE7UUFDQSxLQUFBLFVBQUEsTUFBQSxNQUFBO1VBQ0EsT0FBQSxNQUFBLE1BQUEsS0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTthQUNBOztRQUVBLE1BQUEsVUFBQSxNQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsTUFBQSxLQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxVQUFBO2FBQ0E7O1FBRUEsTUFBQSxVQUFBLE1BQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxNQUFBLEtBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLFVBQUE7OztRQUdBLE1BQUEsVUFBQSxNQUFBO1VBQ0EsT0FBQSxNQUFBOztRQUVBLE9BQUEsVUFBQSxNQUFBLE1BQUE7VUFDQSxPQUFBLE1BQUEsTUFBQSxPQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxRQUFBLEtBQUEsV0FBQSxDQUFBOzs7Ozs7QUMxQkE7R0FDQSxPQUFBLG9CQUFBOztHQUVBLHlCQUFBLFNBQUEsZUFBQTtJQUNBLGNBQUEsYUFBQSxLQUFBOzs7SUFHQSxjQUFBLFNBQUEsUUFBQSxPQUFBLHNCQUFBOzs7R0FHQSxRQUFBLHdDQUFBLFNBQUEsSUFBQSxZQUFBO0lBQ0EsT0FBQTs7TUFFQSxXQUFBLFNBQUEsUUFBQTs7UUFFQSxJQUFBLE9BQUEsSUFBQSxRQUFBLFlBQUEsQ0FBQSxLQUFBLE9BQUEsSUFBQSxRQUFBLFdBQUEsQ0FBQSxHQUFBO1VBQ0EsT0FBQTs7O1FBR0EsT0FBQSxNQUFBLE9BQUEsTUFBQSxRQUFBLElBQUEsT0FBQTs7UUFFQSxPQUFBOzs7O01BSUEsZ0JBQUEsU0FBQSxXQUFBO1FBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7Ozs7OztNQVNBLFlBQUEsU0FBQSxVQUFBOztRQUVBLElBQUEsTUFBQTs7UUFFQSxJQUFBLFFBQUEsU0FBQSxTQUFBLE9BQUE7VUFDQSxPQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsU0FBQSxLQUFBOzs7OztVQUtBLElBQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7OztVQU1BLElBQUEsUUFBQSxNQUFBO1lBQ0EsU0FBQSxPQUFBOzs7Ozs7Ozs7UUFTQSxPQUFBOzs7O01BSUEsaUJBQUEsU0FBQSxXQUFBO1FBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7QUNwRUE7QUFDQSxRQUFBLE9BQUEsWUFBQSxJQUFBLENBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxJQUFBLGtCQUFBO0lBQ0EsTUFBQTtJQUNBLEtBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtJQUNBLE1BQUE7SUFDQSxPQUFBOztFQUVBLFNBQUEsTUFBQSxXQUFBO0lBQ0Esb0JBQUE7TUFDQSxTQUFBO1FBQ0E7UUFDQTs7TUFFQSxPQUFBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsU0FBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7TUFFQSxZQUFBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsY0FBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7TUFFQSxZQUFBO01BQ0EsWUFBQTtNQUNBLFVBQUE7TUFDQSxjQUFBO01BQ0EsY0FBQTtNQUNBLFNBQUE7TUFDQSxhQUFBO01BQ0EsYUFBQTs7SUFFQSxrQkFBQTtNQUNBLGdCQUFBO01BQ0EsZUFBQTtNQUNBLGFBQUE7TUFDQSxZQUFBLENBQUE7UUFDQSxTQUFBO1FBQ0EsVUFBQTtRQUNBLFdBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1NBQ0E7UUFDQSxTQUFBO1FBQ0EsVUFBQTtRQUNBLFdBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBOzs7SUFHQSxNQUFBO0lBQ0EsYUFBQSxTQUFBLEdBQUE7TUFDQSxPQUFBLGdCQUFBOzs7OztBQ3JHQTtHQUNBLE9BQUE7O0dBRUEsV0FBQSx1TUFBQSxTQUFBLFFBQUEsWUFBQSxXQUFBO0lBQ0EsU0FBQSxRQUFBLFVBQUEsWUFBQSxpQkFBQSxrQkFBQTtJQUNBLG1CQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7O0lBRUEsSUFBQSxZQUFBLEdBQUEsYUFBQTs7SUFFQSxHQUFBLFlBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxlQUFBLFlBQUEsS0FBQTs7OztJQUlBLEdBQUEsU0FBQTtJQUNBLEdBQUEsU0FBQTtJQUNBLEdBQUEsaUJBQUE7SUFDQSxHQUFBLGtCQUFBOztJQUVBLFNBQUEsU0FBQTtNQUNBLE9BQUE7U0FDQSxPQUFBO1VBQ0EsSUFBQSxHQUFBO1dBQ0E7VUFDQSxTQUFBLEdBQUEsV0FBQTtVQUNBLFdBQUE7WUFDQSxNQUFBLEdBQUE7WUFDQSxRQUFBLEdBQUEsaUJBQUEsUUFBQSxZQUFBOztVQUVBLGtCQUFBLEdBQUE7VUFDQSxTQUFBLEdBQUE7VUFDQSxNQUFBLEdBQUE7OztTQUdBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFNBQUEsV0FBQTtZQUNBLFdBQUE7YUFDQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7SUFJQSxTQUFBLGdCQUFBLFFBQUE7TUFDQSxPQUFBO01BQ0EsT0FBQTs7TUFFQSxHQUFBLHdCQUFBOzs7SUFHQSxTQUFBLFNBQUE7TUFDQTtTQUNBLE9BQUE7VUFDQSxJQUFBLEdBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsUUFBQSxJQUFBLE9BQUE7O1VBRUEsU0FBQSxXQUFBO1lBQ0EsV0FBQTthQUNBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7OztJQUlBLFNBQUEsaUJBQUE7TUFDQTtTQUNBLE9BQUE7VUFDQSxJQUFBLEdBQUE7V0FDQTtVQUNBLE1BQUEsR0FBQTs7U0FFQTtTQUNBLEtBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7VUFFQSxXQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7OztJQUlBLFNBQUEsWUFBQSxXQUFBLE9BQUE7TUFDQSxHQUFBLGFBQUEsWUFBQSxLQUFBLFdBQUE7OztJQUdBLFNBQUEsOEJBQUE7TUFDQSxHQUFBLE9BQUEsMkJBQUEsU0FBQSx5QkFBQTtRQUNBLElBQUEsMkJBQUEsQ0FBQSxHQUFBLFVBQUEsd0JBQUEsV0FBQTtVQUNBLEdBQUEseUJBQUEsSUFBQSxLQUFBOzs7O01BSUEsR0FBQSxPQUFBLDBCQUFBLFNBQUEsd0JBQUE7UUFDQSxJQUFBLDBCQUFBLENBQUEsR0FBQSxVQUFBLHVCQUFBLFdBQUE7VUFDQSxHQUFBLG1CQUFBLFNBQUEsa0JBQUE7Ozs7O0lBS0EsU0FBQSxvQkFBQTtNQUNBLFlBQUEsY0FBQSxHQUFBO01BQ0EsWUFBQSxXQUFBLEdBQUE7Ozs7SUFJQSxTQUFBLFFBQUEsS0FBQTtNQUNBLFFBQUEsT0FBQSxJQUFBLElBQUE7O01BRUEsSUFBQSxzQkFBQSxHQUFBLGlCQUFBLE1BQUE7O01BRUEsR0FBQSwwQkFBQSxvQkFBQTtNQUNBLEdBQUEseUJBQUEsSUFBQSxLQUFBLEdBQUE7O01BRUEsR0FBQSxpQkFBQSxHQUFBLFVBQUE7TUFDQSxHQUFBLG1CQUFBLEdBQUEsVUFBQTs7TUFFQTtNQUNBOzs7O0lBSUEsSUFBQSxhQUFBLEdBQUE7TUFDQSxPQUFBO1NBQ0E7U0FDQTtTQUNBLEtBQUE7U0FDQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7O0lBS0E7T0FDQSxJQUFBO1FBQ0EsSUFBQTs7T0FFQTtPQUNBLEtBQUE7T0FDQSxNQUFBLFNBQUEsS0FBQTtRQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7OztBQ3JKQTtHQUNBLE9BQUEscUJBQUEsQ0FBQSxjQUFBOztHQUVBLFFBQUEscURBQUEsU0FBQSxPQUFBLGdCQUFBLFFBQUE7SUFDQSxPQUFBO09BQ0E7T0FDQTtPQUNBLEtBQUEsU0FBQSxLQUFBO1FBQ0EsSUFBQSxhQUFBLGtFQUFBLE1BQUE7O1FBRUEsV0FBQSxRQUFBLFNBQUEsS0FBQTtVQUNBLElBQUEsS0FBQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLE1BQUEsSUFBQTs7T0FFQSxNQUFBLFNBQUEsS0FBQTtRQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7QUNwQkE7R0FDQSxPQUFBLG9CQUFBLENBQUE7O0dBRUEsUUFBQSxnQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBOzs7R0FHQSxRQUFBLDRCQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFdBQUEsV0FBQSxJQUFBO01BQ0EsT0FBQTtRQUNBLFNBQUE7Ozs7O0dBS0EsUUFBQSxpQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBOzs7R0FHQSxRQUFBLDJCQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFdBQUEsY0FBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsaUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx1QkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsbUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx3QkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsa0NBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSwwQkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsaUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx1QkFBQTtNQUNBLGNBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsNEJBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSw0QkFBQSxJQUFBO01BQ0EsT0FBQTtRQUNBLFNBQUE7Ozs7O0dBS0EsUUFBQSxpQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBLHVCQUFBO01BQ0EsSUFBQTtPQUNBO01BQ0EsUUFBQTtRQUNBLFFBQUE7Ozs7O0FDakZBO0dBQ0EsT0FBQTs7R0FFQSxXQUFBLG9KQUFBLFNBQUEsUUFBQSxXQUFBLElBQUEsUUFBQTtJQUNBLFlBQUEsaUJBQUEsaUJBQUEsV0FBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBO0lBQ0EsSUFBQSxNQUFBLFVBQUE7O0lBRUEsR0FBQSxZQUFBLFNBQUEsSUFBQSxjQUFBO0lBQ0EsR0FBQSxVQUFBLFNBQUEsSUFBQSxZQUFBO0lBQ0EsR0FBQSxlQUFBLFNBQUEsSUFBQSxpQkFBQTs7SUFFQSxHQUFBLG1CQUFBLElBQUEsb0JBQUE7O0lBRUEsR0FBQSxTQUFBLFlBQUEsS0FBQSxVQUFBLEdBQUE7SUFDQSxHQUFBLGNBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxPQUFBLFlBQUEsS0FBQSxRQUFBLEdBQUE7SUFDQSxHQUFBLFlBQUEsWUFBQSxLQUFBOzs7SUFHQSxHQUFBLFlBQUEsWUFBQSxLQUFBLGFBQUEsR0FBQTtJQUNBLEdBQUEsaUJBQUEsWUFBQSxLQUFBOztJQUVBLEdBQUEsT0FBQSxTQUFBLElBQUEsU0FBQTtJQUNBLEdBQUEsT0FBQSxTQUFBLElBQUEsU0FBQTtJQUNBLEdBQUEsUUFBQSxZQUFBLEtBQUE7SUFDQSxHQUFBLFlBQUEsWUFBQSxLQUFBLFFBQUEsR0FBQTs7SUFFQSxHQUFBLGNBQUE7SUFDQSxHQUFBLGNBQUE7SUFDQSxHQUFBLFNBQUE7SUFDQSxHQUFBLGdCQUFBO0lBQ0EsR0FBQSxrQkFBQTtJQUNBLEdBQUEsZUFBQTtJQUNBLEdBQUEsV0FBQTs7SUFFQTs7SUFFQSxTQUFBLFFBQUE7TUFDQSxJQUFBLFNBQUE7UUFDQSxZQUFBLEdBQUE7UUFDQSxNQUFBLEdBQUE7O1FBRUEsV0FBQSxHQUFBO1FBQ0EsU0FBQSxHQUFBO1FBQ0EsY0FBQSxHQUFBOztRQUVBLGtCQUFBLEdBQUE7OztNQUdBLFVBQUEsT0FBQTs7TUFFQTtTQUNBLE1BQUE7U0FDQTtTQUNBLEtBQUEsU0FBQSxJQUFBO1VBQ0EsR0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBO1lBQ0EsS0FBQSxjQUFBLFlBQUEsS0FBQSxVQUFBLEtBQUE7OztVQUdBLEdBQUEsUUFBQSxHQUFBO1VBQ0EsR0FBQSxjQUFBLEdBQUE7O1VBRUEsSUFBQSxNQUFBLEdBQUEsY0FBQSxHQUFBO1VBQ0EsR0FBQSxhQUFBLEdBQUEsY0FBQSxHQUFBLFNBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQSxPQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOzs7O0lBSUEsR0FBQSxpQkFBQSxTQUFBLFNBQUEsT0FBQTtNQUNBLEdBQUEsUUFBQTs7O0lBR0EsV0FBQSxVQUFBO0lBQ0EsV0FBQSxRQUFBOztJQUVBLFdBQUEsYUFBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQSxPQUFBO01BQ0EsR0FBQSxPQUFBLE1BQUEsU0FBQSxNQUFBO1FBQ0EsSUFBQSxDQUFBLE1BQUE7VUFDQTs7O1FBR0EsR0FBQSxTQUFBLEtBQUE7Ozs7O0lBS0EsU0FBQSxjQUFBLE1BQUE7TUFDQTtTQUNBLE9BQUE7VUFDQSxJQUFBLEtBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsUUFBQSxJQUFBLE9BQUE7O1VBRUEsVUFBQSxJQUFBLGNBQUEsS0FBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7O0lBS0EsU0FBQSxnQkFBQSxNQUFBO01BQ0EsSUFBQSxzQkFBQSxPQUFBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTtRQUNBLFVBQUE7UUFDQSxTQUFBO1VBQ0EsYUFBQSxXQUFBO1lBQ0EsT0FBQTs7Ozs7TUFLQSxvQkFBQSxPQUFBLEtBQUEsV0FBQTtRQUNBOzs7OztJQUtBLFNBQUEsYUFBQSxNQUFBO01BQ0EsSUFBQSxtQkFBQSxPQUFBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTtRQUNBLFVBQUE7UUFDQSxTQUFBO1VBQ0EsYUFBQSxXQUFBO1lBQ0EsT0FBQTs7Ozs7TUFLQSxpQkFBQSxPQUFBLEtBQUEsU0FBQSxRQUFBOzs7UUFHQTs7Ozs7SUFLQSxTQUFBLFNBQUEsTUFBQTtNQUNBLElBQUEsUUFBQSxlQUFBO1FBQ0E7V0FDQSxPQUFBO1lBQ0EsSUFBQSxLQUFBOztXQUVBO1dBQ0EsS0FBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztZQUVBOztXQUVBLE1BQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7Ozs7O0lBTUEsU0FBQSxZQUFBLE1BQUE7TUFDQSxHQUFBLE9BQUE7TUFDQSxHQUFBLE9BQUE7O01BRUE7Ozs7SUFJQSxTQUFBLFlBQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7OztJQUlBLFNBQUEsU0FBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7Ozs7R0FLQSxXQUFBLDRHQUFBLFNBQUEsUUFBQSxXQUFBLFFBQUEsWUFBQSxpQkFBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBO0lBQ0EsSUFBQSxNQUFBLFVBQUE7O0lBRUEsR0FBQSxPQUFBLFNBQUEsSUFBQSxTQUFBO0lBQ0EsR0FBQSxPQUFBLFNBQUEsSUFBQSxTQUFBO0lBQ0EsR0FBQSxRQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsWUFBQSxZQUFBLEtBQUEsUUFBQSxHQUFBOztJQUVBLEdBQUEsY0FBQTtJQUNBLEdBQUEsY0FBQTtJQUNBLEdBQUEsV0FBQTs7SUFFQTs7SUFFQSxTQUFBLFFBQUE7TUFDQSxJQUFBLFNBQUE7UUFDQSxZQUFBLEdBQUE7UUFDQSxNQUFBLEdBQUE7UUFDQSxXQUFBOzs7TUFHQSxVQUFBLE9BQUE7O01BRUE7U0FDQSxNQUFBO1NBQ0E7U0FDQSxLQUFBLFNBQUEsSUFBQTtVQUNBLEdBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQTtZQUNBLEtBQUEsY0FBQSxZQUFBLEtBQUEsVUFBQSxLQUFBOzs7VUFHQSxHQUFBLFFBQUEsR0FBQTtVQUNBLEdBQUEsY0FBQSxHQUFBOztVQUVBLElBQUEsTUFBQSxHQUFBLGNBQUEsR0FBQTtVQUNBLEdBQUEsYUFBQSxHQUFBLGNBQUEsR0FBQSxTQUFBLElBQUEsT0FBQSxLQUFBLE1BQUEsT0FBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLEtBQUEsT0FBQTs7Ozs7SUFLQSxTQUFBLFNBQUEsTUFBQTtNQUNBLElBQUEsUUFBQSxlQUFBO1FBQ0E7V0FDQSxPQUFBO1lBQ0EsSUFBQSxLQUFBOztXQUVBO1dBQ0EsS0FBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztZQUVBOztXQUVBLE1BQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7Ozs7O0lBTUEsU0FBQSxZQUFBLE1BQUE7TUFDQSxHQUFBLE9BQUE7TUFDQSxHQUFBLE9BQUE7O01BRUE7Ozs7SUFJQSxTQUFBLFlBQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7Ozs7O0dBTUEsV0FBQSx1R0FBQSxTQUFBLFFBQUEsZ0JBQUEsUUFBQSxpQkFBQSxZQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7O0lBRUEsUUFBQSxPQUFBLElBQUE7O0lBRUEsR0FBQSxPQUFBO0lBQ0EsR0FBQSxRQUFBOztJQUVBLEdBQUEsU0FBQTtJQUNBLEdBQUEsV0FBQTs7SUFFQSxNQUFBOztJQUVBLFNBQUEsTUFBQSxNQUFBO01BQ0EsR0FBQSxPQUFBOztNQUVBO1NBQ0EsTUFBQTtVQUNBLE1BQUEsWUFBQTtVQUNBLE1BQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLEdBQUEsUUFBQSxJQUFBO1VBQ0EsR0FBQSxjQUFBLElBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBLFFBQUE7TUFDQSxHQUFBLGtCQUFBOztNQUVBO1NBQ0EsT0FBQTtVQUNBLElBQUEsWUFBQTtXQUNBO1VBQ0EsY0FBQSxPQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLGVBQUEsTUFBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLEdBQUEsa0JBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBO01BQ0EsZUFBQTs7Ozs7R0FLQSxXQUFBLHNGQUFBLFNBQUEsUUFBQSxnQkFBQSxRQUFBLFdBQUEsYUFBQTtJQUNBLElBQUEsS0FBQTs7SUFFQSxRQUFBLE9BQUEsSUFBQTs7SUFFQSxHQUFBLGVBQUE7SUFDQSxHQUFBLFNBQUE7O0lBRUEsU0FBQSxlQUFBO01BQ0EsR0FBQSxzQkFBQTs7TUFFQTtTQUNBLE9BQUE7VUFDQSxJQUFBLFlBQUE7V0FDQTtVQUNBLFFBQUEsR0FBQTs7U0FFQTtTQUNBLEtBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7VUFFQSxlQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsR0FBQSxzQkFBQTs7VUFFQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0lBSUEsU0FBQSxTQUFBO01BQ0EsZUFBQTs7Ozs7QUN0V0E7R0FDQSxPQUFBOztHQUVBLFdBQUEsNkVBQUEsVUFBQSxRQUFBLElBQUEsV0FBQSxVQUFBLFFBQUEsVUFBQTtJQUNBLElBQUEsS0FBQTs7SUFFQSxHQUFBLFFBQUE7O0lBRUEsU0FBQSxRQUFBO01BQ0EsT0FBQTtTQUNBLEtBQUE7VUFDQSxVQUFBLEdBQUE7VUFDQSxVQUFBLEdBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsTUFBQTtVQUNBLE9BQUEsUUFBQSxLQUFBLE9BQUE7O1VBRUEsU0FBQSxXQUFBO1lBQ0EsVUFBQSxJQUFBO2FBQ0E7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7O0FDdkJBO0dBQ0EsT0FBQSxtQkFBQSxDQUFBO0dBQ0EsUUFBQSwwQkFBQSxVQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxTQUFBO0tBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5bqU55So5YWl5Y+jXG4vLyBNb2R1bGU6IGd1bHVcbi8vIERlcGVuZGVuY2llczpcbi8vICAgIG5nUm91dGUsIGh0dHBJbnRlcmNlcHRvcnMsIGd1bHUubWlzc2luZ1xuXG4vKiBnbG9iYWwgZmFsbGJhY2tIYXNoICovXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ25nTG9jYWxlJyxcbiAgICAndG9hc3RyJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAnY3VzdG9tLmRpcmVjdGl2ZXMnLFxuICAgICdodHRwSW50ZXJjZXB0b3JzJyxcbiAgICAnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICd1dGlsLmZpbHRlcnMnLFxuICAgICd1dGlsLmRhdGUnLFxuICAgICdndWx1LmxvZ2luJyxcbiAgICAnZ3VsdS5jbGllbnRfc2VydmljZScsXG4gICAgJ2d1bHUubWlzc2luZydcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkc3RhdGVQcm92aWRlcikge1xuICAgIC8vIG5vdCB1c2UgaHRtbDUgaGlzdG9yeSBhcGlcbiAgICAvLyBidXQgdXNlIGhhc2hiYW5nXG4gICAgJGxvY2F0aW9uUHJvdmlkZXJcbiAgICAgIC5odG1sNU1vZGUoZmFsc2UpXG4gICAgICAuaGFzaFByZWZpeCgnIScpO1xuXG4gICAgLy8gZGVmaW5lIDQwNFxuICAgICR1cmxSb3V0ZXJQcm92aWRlclxuICAgICAgLm90aGVyd2lzZSgnL2xvZ2luJyk7XG5cbiAgICAvLyBBUEkgU2VydmVyXG4gICAgQVBJX1NFUlZFUlMgPSB7XG4gICAgICAvLyBjc2VydmljZTogJ2h0dHA6Ly9jLmlmZGl1LmNvbSdcbiAgICAgIGNzZXJ2aWNlOiAnaHR0cDovL28uZHA6MzAwMCdcbiAgICB9O1xuICB9KVxuICAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRsb2NhdGlvbiwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcbiAgICB2YXIgcmVnID0gL1tcXCZcXD9dXz1cXGQrLztcblxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xuICAgICRyb290U2NvcGUuJHN0YXRlUGFyYW1zID0gJHN0YXRlUGFyYW1zO1xuXG4gICAgLy8g55So5LqO6L+U5Zue5LiK5bGC6aG16Z2iXG4gICAgJHJvb3RTY29wZVxuICAgICAgLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICRsb2NhdGlvbi51cmwoKTtcbiAgICAgIH0sIGZ1bmN0aW9uKGN1cnJlbnQsIG9sZCkge1xuICAgICAgICBpZiAoY3VycmVudC5yZXBsYWNlKHJlZywgJycpID09PSBvbGQucmVwbGFjZShyZWcsICcnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgICRyb290U2NvcGUuYmFja1VybCA9IG9sZDtcbiAgICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS5iYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbG9jYXRpb24udXJsKCRyb290U2NvcGUuYmFja1VybCk7XG4gICAgfVxuICB9KTtcblxuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmNsaWVudF9zZXJ2aWNlJywgW1xuICAgICd1aS5yb3V0ZXInLFxuICAgICdndWx1LmluZGVudCdcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2NsaWVudF9zZXJ2aWNlJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL2luZGVudHMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2NsaWVudC1zZXJ2aWNlL2Rhc2hib2FyZC5odG0nLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgSW5kZW50RW51bXM6ICdJbmRlbnRFbnVtcydcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnY2xpZW50X3NlcnZpY2UubGlzdCcsIHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvbGlzdC5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnSW5kZW50TGlzdEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdjbGllbnRfc2VydmljZS5hcHByb3ZhbCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcHJvdmFsJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvbGlzdF9hcHByb3ZhbC5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnSW5kZW50QXBwcm92YWxMaXN0Q3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2NsaWVudF9zZXJ2aWNlLmluZGVudCcsIHtcbiAgICAgICAgdXJsOiAnL3tpbmRlbnRfaWQ6WzAtOV0rfScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaW5kZW50L2VkaXQuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0luZGVudEN0cmwnXG4gICAgICB9KTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuaW5kZW50JywgW1xuICAgICdndWx1LmluZGVudC5zdmNzJyxcbiAgICAnZ3VsdS5pbmRlbnQuZW51bXMnXG4gIF0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmxvZ2luJywgW1xuICAgICd1aS5yb3V0ZXInLFxuICAgICdndWx1LmxvZ2luLnN2Y3MnXG4gIF0pXG5cbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xvZ2luL2xvZ2luLmh0bScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgICB9KTtcbiAgfSk7XG4iLCIvLyA0MDQg6aG16Z2iXG4vLyBNb2R1bGU6IGd1bHUubWlzc2luZ1xuLy8gRGVwZW5kZW5jaWVzOiBuZ1JvdXRlXG5cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5taXNzaW5nJywgWyd1aS5yb3V0ZXInXSlcblxuICAvLyDphY3nva4gcm91dGVcbiAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdtaXNzaW5nJywge1xuICAgICAgICB1cmw6ICcvbWlzc2luZycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnNDA0LzQwNC5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnTWlzc2luZ0N0cmwnXG4gICAgICB9KTtcbiAgfSlcblxuICAvLyA0MDQgY29udHJvbGxlclxuICAuY29udHJvbGxlcignTWlzc2luZ0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgY29uc29sZS5sb2coJ0lgbSBoZXJlJyk7XG4gICAgLy8gVE9ETzpcbiAgICAvLyAxLiBzaG93IGxhc3QgcGF0aCBhbmQgcGFnZSBuYW1lXG4gIH0pO1xuIiwiLy8g6Ieq5a6a5LmJIGRpcmVjdGl2ZXNcblxuYW5ndWxhclxuICAubW9kdWxlKCdjdXN0b20uZGlyZWN0aXZlcycsIFtdKVxuICAuZGlyZWN0aXZlKCduZ0luZGV0ZXJtaW5hdGUnLCBmdW5jdGlvbigkY29tcGlsZSkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgc2NvcGUuJHdhdGNoKGF0dHJpYnV0ZXNbJ25nSW5kZXRlcm1pbmF0ZSddLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQucHJvcCgnaW5kZXRlcm1pbmF0ZScsICEhdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsImFuZ3VsYXJcbiAgLm1vZHVsZSgndXRpbC5maWx0ZXJzJywgW10pXG5cbiAgLmZpbHRlcignbW9iaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHMpIHtcbiAgICAgIGlmIChzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICBzID0gcy5yZXBsYWNlKC9bXFxzXFwtXSsvZywgJycpO1xuXG4gICAgICBpZiAocy5sZW5ndGggPCAzKSB7XG4gICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2EgPSBzLnNwbGl0KCcnKTtcblxuICAgICAgc2Euc3BsaWNlKDMsIDAsICctJyk7XG5cbiAgICAgIGlmIChzLmxlbmd0aCA+PSA3KSB7XG4gICAgICAgIHNhLnNwbGljZSg4LCAwLCAnLScpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2Euam9pbignJyk7XG4gICAgfTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ3V0aWwuZGF0ZScsIFtdKVxuICAuZmFjdG9yeSgnRGF0ZVV0aWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRvU3RyaW5nID0gZnVuY3Rpb24gKGRhdGUsIHMpIHtcbiAgICAgIHJldHVybiBkYXRlLmdldEZ1bGxZZWFyKCkgKyBzICsgKGRhdGUuZ2V0TW9udGgoKSArIDEpICsgcyArIGRhdGUuZ2V0RGF0ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b0xvY2FsRGF0ZVN0cmluZzogZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRvU3RyaW5nKGRhdGUsICctJyk7XG4gICAgICB9LFxuXG4gICAgICB0b0xvY2FsVGltZVN0cmluZzogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgdmFyIG0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcblxuICAgICAgICBpZiAoaCA8IDEwKSB7XG4gICAgICAgICAgaCA9ICcwJyArIGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobSA8IDEwKSB7XG4gICAgICAgICAgbSA9ICcwJyArIG07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3RvU3RyaW5nKGRhdGUsICctJyksIGggKyAnOicgKyBtXS5qb2luKCcgJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTsiLCIvLyDmnprkuL4gU2VydmljZVxuYW5ndWxhclxuICAubW9kdWxlKCd1dGlsLmVudW1zJywgW10pXG4gIC5mYWN0b3J5KCdFbnVtcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKEVOVU1TKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWw6IGZ1bmN0aW9uIChuYW1lLCB0ZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnRleHQgPT09IHRleHQ7XG4gICAgICAgICAgfSkudmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHRleHQ6IGZ1bmN0aW9uIChuYW1lLCB2YWwpIHtcbiAgICAgICAgICByZXR1cm4gRU5VTVNbbmFtZV0uZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsdWUgPT09IHZhbDtcbiAgICAgICAgICB9KS50ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBpdGVtOiBmdW5jdGlvbiAobmFtZSwgdmFsKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZhbHVlID09PSB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxpc3Q6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBpdGVtczogZnVuY3Rpb24gKG5hbWUsIHZhbHMpIHtcbiAgICAgICAgICByZXR1cm4gRU5VTVNbbmFtZV0uZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFscy5pbmRleE9mKGl0ZW0udmFsdWUpICE9PSAtMTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2h0dHBJbnRlcmNlcHRvcnMnLCBbXSlcblxuICAuY29uZmlnKGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdodHRwSW50ZXJjZXB0b3InKTtcbiAgICBcbiAgICAvLyBBbmd1bGFyICRodHRwIGlzbuKAmXQgYXBwZW5kaW5nIHRoZSBoZWFkZXIgWC1SZXF1ZXN0ZWQtV2l0aCA9IFhNTEh0dHBSZXF1ZXN0IHNpbmNlIEFuZ3VsYXIgMS4zLjBcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uW1wiWC1SZXF1ZXN0ZWQtV2l0aFwiXSA9ICdYTUxIdHRwUmVxdWVzdCc7XG4gIH0pXG5cbiAgLmZhY3RvcnkoJ2h0dHBJbnRlcmNlcHRvcicsIGZ1bmN0aW9uKCRxLCAkcm9vdFNjb3BlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIOivt+axguWJjeS/ruaUuSByZXF1ZXN0IOmFjee9rlxuICAgICAgJ3JlcXVlc3QnOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgLy8g6Iul6K+35rGC55qE5piv5qih5p2/77yM5oiW5bey5Yqg5LiK5pe26Ze05oiz55qEIHVybCDlnLDlnYDvvIzliJnkuI3pnIDopoHliqDml7bpl7TmiLNcbiAgICAgICAgaWYgKGNvbmZpZy51cmwuaW5kZXhPZignLmh0bScpICE9PSAtMSB8fCBjb25maWcudXJsLmluZGV4T2YoJz9fPScpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcudXJsID0gY29uZmlnLnVybCArICc/Xz0nICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH0sXG5cbiAgICAgIC8vIOivt+axguWHuumUme+8jOS6pOe7mSBlcnJvciBjYWxsYmFjayDlpITnkIZcbiAgICAgICdyZXF1ZXN0RXJyb3InOiBmdW5jdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgfSxcblxuICAgICAgLy8g5ZON5bqU5pWw5o2u5oyJ57qm5a6a5aSE55CGXG4gICAgICAvLyB7XG4gICAgICAvLyAgIGNvZGU6IDIwMCwgLy8g6Ieq5a6a5LmJ54q25oCB56CB77yMMjAwIOaIkOWKn++8jOmdniAyMDAg5Z2H5LiN5oiQ5YqfXG4gICAgICAvLyAgIG1zZzogJ+aTjeS9nOaPkOekuicsIC8vIOS4jeiDveWSjCBkYXRhIOWFseWtmFxuICAgICAgLy8gICBkYXRhOiB7fSAvLyDnlKjmiLfmlbDmja5cbiAgICAgIC8vIH1cbiAgICAgICdyZXNwb25zZSc6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIOacjeWKoeerr+i/lOWbnueahOacieaViOeUqOaIt+aVsOaNrlxuICAgICAgICB2YXIgZGF0YSwgY29kZTtcblxuICAgICAgICBpZiAoYW5ndWxhci5pc09iamVjdChyZXNwb25zZS5kYXRhKSkge1xuICAgICAgICAgIGNvZGUgPSByZXNwb25zZS5kYXRhLmNvZGU7XG4gICAgICAgICAgZGF0YSA9IHJlc3BvbnNlLmRhdGEuZGF0YTtcblxuICAgICAgICAgIC8vIOiLpSBzdGF0dXMgMjAwLCDkuJQgY29kZSAhMjAw77yM5YiZ6L+U5Zue55qE5piv5pON5L2c6ZSZ6K+v5o+Q56S65L+h5oGvXG4gICAgICAgICAgLy8g6YKj5LmI77yMY2FsbGJhY2sg5Lya5o6l5pS25Yiw5LiL6Z2i5b2i5byP55qE5Y+C5pWw77yaXG4gICAgICAgICAgLy8geyBjb2RlOiAyMDAwMSwgbXNnOiAn5pON5L2c5aSx6LSlJyB9XG4gICAgICAgICAgaWYgKGNvZGUgIT09IDIwMCkge1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8g6Iul5pyN5Yqh56uv6L+U5Zue55qEIGRhdGEgIW51bGzvvIzliJnov5Tlm57nmoTmmK/mnInmlYjlnLDnlKjmiLfmlbDmja5cbiAgICAgICAgICAvLyDpgqPkuYjvvIxjYWxsYmFjayDkvJrmjqXmlLbliLDkuIvpnaLlvaLlvI/lj4LmlbDvvJpcbiAgICAgICAgICAvLyB7IGl0ZW1zOiBbLi4uXSwgdG90YWxfY291bnQ6IDEwMCB9XG4gICAgICAgICAgaWYgKGRhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGRhdGE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8g6Iul5pyN5Yqh56uv6L+U5Zue55qEIGRhdGEg5YC85Li6IG51bGzvvIzliJnov5Tlm57nmoTmmK/mj5DnpLrkv6Hmga9cbiAgICAgICAgICAvLyDpgqPkuYggY2FsbGJhY2sg5Lya5o6l5pS25Yiw5LiL6Z2i5b2i5byP55qE5Y+C5pWw77yaXG4gICAgICAgICAgLy8geyBjb2RlOiAyMDAsIG1zZzogJ+aTjeS9nOaIkOWKnycgfVxuICAgICAgICAgIC8vIOm7mOiupOS4uuatpFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSxcblxuICAgICAgLy8g5ZON5bqU5Ye66ZSZ77yM5Lqk57uZIGVycm9yIGNhbGxiYWNrIOWkhOeQhlxuICAgICAgJ3Jlc3BvbnNlRXJyb3InOiBmdW5jdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKFwibmdMb2NhbGVcIiwgW10sIFtcIiRwcm92aWRlXCIsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gIHZhciBQTFVSQUxfQ0FURUdPUlkgPSB7XG4gICAgWkVSTzogXCJ6ZXJvXCIsXG4gICAgT05FOiBcIm9uZVwiLFxuICAgIFRXTzogXCJ0d29cIixcbiAgICBGRVc6IFwiZmV3XCIsXG4gICAgTUFOWTogXCJtYW55XCIsXG4gICAgT1RIRVI6IFwib3RoZXJcIlxuICB9O1xuICAkcHJvdmlkZS52YWx1ZShcIiRsb2NhbGVcIiwge1xuICAgIFwiREFURVRJTUVfRk9STUFUU1wiOiB7XG4gICAgICBcIkFNUE1TXCI6IFtcbiAgICAgICAgXCJcXHU0ZTBhXFx1NTM0OFwiLFxuICAgICAgICBcIlxcdTRlMGJcXHU1MzQ4XCJcbiAgICAgIF0sXG4gICAgICBcIkRBWVwiOiBbXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU2NWU1XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTAwXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZThjXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTA5XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU1NmRiXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTk0XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU1MTZkXCJcbiAgICAgIF0sXG4gICAgICBcIk1PTlRIXCI6IFtcbiAgICAgICAgXCIxXFx1NjcwOFwiLFxuICAgICAgICBcIjJcXHU2NzA4XCIsXG4gICAgICAgIFwiM1xcdTY3MDhcIixcbiAgICAgICAgXCI0XFx1NjcwOFwiLFxuICAgICAgICBcIjVcXHU2NzA4XCIsXG4gICAgICAgIFwiNlxcdTY3MDhcIixcbiAgICAgICAgXCI3XFx1NjcwOFwiLFxuICAgICAgICBcIjhcXHU2NzA4XCIsXG4gICAgICAgIFwiOVxcdTY3MDhcIixcbiAgICAgICAgXCIxMFxcdTY3MDhcIixcbiAgICAgICAgXCIxMVxcdTY3MDhcIixcbiAgICAgICAgXCIxMlxcdTY3MDhcIlxuICAgICAgXSxcbiAgICAgIFwiU0hPUlREQVlcIjogW1xuICAgICAgICBcIlxcdTU0NjhcXHU2NWU1XCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTRlMDBcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NGU4Y1wiLFxuICAgICAgICBcIlxcdTU0NjhcXHU0ZTA5XCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTU2ZGJcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NGU5NFwiLFxuICAgICAgICBcIlxcdTU0NjhcXHU1MTZkXCJcbiAgICAgIF0sXG4gICAgICBcIlNIT1JUTU9OVEhcIjogW1xuICAgICAgICBcIjFcXHU2NzA4XCIsXG4gICAgICAgIFwiMlxcdTY3MDhcIixcbiAgICAgICAgXCIzXFx1NjcwOFwiLFxuICAgICAgICBcIjRcXHU2NzA4XCIsXG4gICAgICAgIFwiNVxcdTY3MDhcIixcbiAgICAgICAgXCI2XFx1NjcwOFwiLFxuICAgICAgICBcIjdcXHU2NzA4XCIsXG4gICAgICAgIFwiOFxcdTY3MDhcIixcbiAgICAgICAgXCI5XFx1NjcwOFwiLFxuICAgICAgICBcIjEwXFx1NjcwOFwiLFxuICAgICAgICBcIjExXFx1NjcwOFwiLFxuICAgICAgICBcIjEyXFx1NjcwOFwiXG4gICAgICBdLFxuICAgICAgXCJmdWxsRGF0ZVwiOiBcInlcXHU1ZTc0TVxcdTY3MDhkXFx1NjVlNUVFRUVcIixcbiAgICAgIFwibG9uZ0RhdGVcIjogXCJ5XFx1NWU3NE1cXHU2NzA4ZFxcdTY1ZTVcIixcbiAgICAgIFwibWVkaXVtXCI6IFwieXl5eS1NLWQgYWg6bW06c3NcIixcbiAgICAgIFwibWVkaXVtRGF0ZVwiOiBcInl5eXktTS1kXCIsXG4gICAgICBcIm1lZGl1bVRpbWVcIjogXCJhaDptbTpzc1wiLFxuICAgICAgXCJzaG9ydFwiOiBcInl5LU0tZCBhaDptbVwiLFxuICAgICAgXCJzaG9ydERhdGVcIjogXCJ5eS1NLWRcIixcbiAgICAgIFwic2hvcnRUaW1lXCI6IFwiYWg6bW1cIlxuICAgIH0sXG4gICAgXCJOVU1CRVJfRk9STUFUU1wiOiB7XG4gICAgICBcIkNVUlJFTkNZX1NZTVwiOiBcIlxcdTAwYTVcIixcbiAgICAgIFwiREVDSU1BTF9TRVBcIjogXCIuXCIsXG4gICAgICBcIkdST1VQX1NFUFwiOiBcIixcIixcbiAgICAgIFwiUEFUVEVSTlNcIjogW3tcbiAgICAgICAgXCJnU2l6ZVwiOiAzLFxuICAgICAgICBcImxnU2l6ZVwiOiAzLFxuICAgICAgICBcIm1hY0ZyYWNcIjogMCxcbiAgICAgICAgXCJtYXhGcmFjXCI6IDMsXG4gICAgICAgIFwibWluRnJhY1wiOiAwLFxuICAgICAgICBcIm1pbkludFwiOiAxLFxuICAgICAgICBcIm5lZ1ByZVwiOiBcIi1cIixcbiAgICAgICAgXCJuZWdTdWZcIjogXCJcIixcbiAgICAgICAgXCJwb3NQcmVcIjogXCJcIixcbiAgICAgICAgXCJwb3NTdWZcIjogXCJcIlxuICAgICAgfSwge1xuICAgICAgICBcImdTaXplXCI6IDMsXG4gICAgICAgIFwibGdTaXplXCI6IDMsXG4gICAgICAgIFwibWFjRnJhY1wiOiAwLFxuICAgICAgICBcIm1heEZyYWNcIjogMixcbiAgICAgICAgXCJtaW5GcmFjXCI6IDIsXG4gICAgICAgIFwibWluSW50XCI6IDEsXG4gICAgICAgIFwibmVnUHJlXCI6IFwiKFxcdTAwYTRcIixcbiAgICAgICAgXCJuZWdTdWZcIjogXCIpXCIsXG4gICAgICAgIFwicG9zUHJlXCI6IFwiXFx1MDBhNFwiLFxuICAgICAgICBcInBvc1N1ZlwiOiBcIlwiXG4gICAgICB9XVxuICAgIH0sXG4gICAgXCJpZFwiOiBcInpoLWNuXCIsXG4gICAgXCJwbHVyYWxDYXRcIjogZnVuY3Rpb24obikge1xuICAgICAgcmV0dXJuIFBMVVJBTF9DQVRFR09SWS5PVEhFUjtcbiAgICB9XG4gIH0pO1xufV0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudCcpXG4gIFxuICAuY29udHJvbGxlcignSW5kZW50Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCAkdGltZW91dCxcbiAgICAkZmlsdGVyLCB0b2FzdHIsIERhdGVVdGlsLCBJbmRlbnRzU3ZjLCBJbmRlbnRDcmVhdGVTdmMsIEluZGVudFVucmVhY2hTdmMsIEluZGVudFN2YyxcbiAgICBJbmRlbnRWYWxpZGF0ZVN2YywgSW5kZW50RW51bXMpIHtcbiAgICB2YXIgdm0gPSAkc2NvcGU7XG5cbiAgICB2YXIgaW5kZW50X2lkID0gdm0uJHN0YXRlUGFyYW1zLmluZGVudF9pZDtcblxuICAgIHZtLnR5cGVfbGlzdCA9IEluZGVudEVudW1zLmxpc3QoJ29yZGVyX3R5cGUnKTtcbiAgICB2bS5jaGFubmVsX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdjaGFubmVsJyk7XG4gICAgLy8gdm0uYnJhbmRfbGlzdCA9IEluZGVudEVudW1zLmxpc3QoJ2JyYW5kJyk7XG4gICAgLy8gdm0uc2VyaWVzX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdzZXJpZXMnKTtcblxuICAgIHZtLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgICB2bS5jYW5jZWwgPSBjYW5jZWw7XG4gICAgdm0uY2FuY2VsX2NvbmZpcm0gPSBjYW5jZWxfY29uZmlybTtcbiAgICB2bS5vcGVuX2RhdGVwaWNrZXIgPSBvcGVuX2RhdGVwaWNrZXI7XG5cbiAgICBmdW5jdGlvbiBzdWJtaXQoKSB7XG4gICAgICByZXR1cm4gSW5kZW50VmFsaWRhdGVTdmNcbiAgICAgICAgLnVwZGF0ZSh7XG4gICAgICAgICAgaWQ6IHZtLmlkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlX2lkOiB2bS5vcmRlcl90eXBlLnZhbHVlLFxuICAgICAgICAgIHJlcXVlc3Rlcjoge1xuICAgICAgICAgICAgbmFtZTogdm0ucmVxdWVzdGVyX25hbWUsXG4gICAgICAgICAgICBtb2JpbGU6IHZtLnJlcXVlc3Rlcl9tb2JpbGUucmVwbGFjZSgvW1xcc1xcLV0rL2csICcnKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgYXBwb2ludG1lbnRfdGltZTogdm0uYXBwb2ludG1lbnRfdGltZSxcbiAgICAgICAgICBhZGRyZXNzOiB2bS5hZGRyZXNzLFxuICAgICAgICAgIG1lbW86IHZtLm1lbW8sXG4gICAgICAgICAgLy8gY2hhbm5lbDogdm0uY2hhbm5lbC52YWx1ZVxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn6aKE57qm5Y2V56Gu6K6k5bm255Sf5pWI5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuYmFjaygpO1xuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+mihOe6puWNleehruiupOW5tueUn+aViOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvcGVuX2RhdGVwaWNrZXIoJGV2ZW50KSB7XG4gICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgdm0uYXBwb2ludG1lbnRfdGltZV9vcGVuID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICBJbmRlbnRTdmNcbiAgICAgICAgLnJlbW92ZSh7XG4gICAgICAgICAgaWQ6IHZtLmlkXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICflj5bmtojpooTnuqbljZXmiJDlip8nKTtcblxuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5iYWNrKCk7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5Y+W5raI6aKE57qm5Y2V5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbF9jb25maXJtKCkge1xuICAgICAgSW5kZW50VW5yZWFjaFN2Y1xuICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICBpZDogdm0uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIG1lbW86IHZtLm1lbW9cbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKHJlcy5tc2cgfHwgJ+W3suWPlua2iOehruiupOiuouWNlScpO1xuXG4gICAgICAgICAgJHJvb3RTY29wZS5iYWNrKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5Y+W5raI56Gu6K6k6K6i5Y2V77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbGVjdF9pdGVtKGxpc3RfbmFtZSwgdmFsdWUpIHtcbiAgICAgIHZtW2xpc3RfbmFtZV0gPSBJbmRlbnRFbnVtcy5pdGVtKGxpc3RfbmFtZSwgdmFsdWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhdGNoX2FwcG9pbnRtZW50X3RpbWVfcGFydCgpIHtcbiAgICAgIHZtLiR3YXRjaCgnYXBwb2ludG1lbnRfdGltZV9iZWZvcmUnLCBmdW5jdGlvbihhcHBvaW50bWVudF90aW1lX2JlZm9yZSkge1xuICAgICAgICBpZiAoYXBwb2ludG1lbnRfdGltZV9iZWZvcmUgJiYgIXZtLmVkaXRfZm9ybS5hcHBvaW50bWVudF90aW1lX2JlZm9yZS4kcHJpc3RpbmUpIHtcbiAgICAgICAgICB2bS5hcHBvaW50bWVudF90aW1lX2FmdGVyID0gbmV3IERhdGUoYXBwb2ludG1lbnRfdGltZV9iZWZvcmUpOyAgXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2bS4kd2F0Y2goJ2FwcG9pbnRtZW50X3RpbWVfYWZ0ZXInLCBmdW5jdGlvbihhcHBvaW50bWVudF90aW1lX2FmdGVyKSB7XG4gICAgICAgIGlmIChhcHBvaW50bWVudF90aW1lX2FmdGVyICYmICF2bS5lZGl0X2Zvcm0uYXBwb2ludG1lbnRfdGltZV9hZnRlci4kcHJpc3RpbmUpIHtcbiAgICAgICAgICB2bS5hcHBvaW50bWVudF90aW1lID0gRGF0ZVV0aWwudG9Mb2NhbFRpbWVTdHJpbmcoYXBwb2ludG1lbnRfdGltZV9hZnRlcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldF9zZWxlY3RlZF9pdGVtKCkge1xuICAgICAgc2VsZWN0X2l0ZW0oJ29yZGVyX3R5cGUnLCB2bS50eXBlX2lkKTtcbiAgICAgIHNlbGVjdF9pdGVtKCdjaGFubmVsJywgdm0uY2hhbm5lbCk7XG4gICAgICAvLyBzZWxlY3RfaXRlbSgnYnJhbmQnLCB2bS5jYXIuYnJhbmQpO1xuICAgICAgLy8gc2VsZWN0X2l0ZW0oJ3NlcmllcycsIHZtLmNhci5zZXJpZXMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVyKHJlcykge1xuICAgICAgYW5ndWxhci5leHRlbmQodm0sIHJlcy50b0pTT04oKSk7XG5cbiAgICAgIHZhciBhcHBvaW50bWVudF90aW1lX3NwID0gdm0uYXBwb2ludG1lbnRfdGltZS5zcGxpdCgnICcpO1xuXG4gICAgICB2bS5hcHBvaW50bWVudF90aW1lX2JlZm9yZSA9IGFwcG9pbnRtZW50X3RpbWVfc3BbMF07XG4gICAgICB2bS5hcHBvaW50bWVudF90aW1lX2FmdGVyID0gbmV3IERhdGUodm0uYXBwb2ludG1lbnRfdGltZSk7XG5cbiAgICAgIHZtLnJlcXVlc3Rlcl9uYW1lID0gdm0ucmVxdWVzdGVyLm5hbWU7XG4gICAgICB2bS5yZXF1ZXN0ZXJfbW9iaWxlID0gdm0ucmVxdWVzdGVyLm1vYmlsZTtcblxuICAgICAgc2V0X3NlbGVjdGVkX2l0ZW0oKTtcbiAgICAgIHdhdGNoX2FwcG9pbnRtZW50X3RpbWVfcGFydCgpO1xuICAgIH1cblxuICAgIC8vIOaWsOW7uumihOe6puWNlVxuICAgIGlmIChpbmRlbnRfaWQgPT0gMCkge1xuICAgICAgcmV0dXJuIEluZGVudENyZWF0ZVN2Y1xuICAgICAgICAuc2F2ZSgpXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihoYW5kbGVyKVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+aWsOW7uumihOe6puWNleWksei0pe+8jOivt+WIt+aWsOmHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDoi6Xmm7TmlrDpooTnuqbljZXvvIzliJnojrflj5bpooTnuqbljZXkv6Hmga9cbiAgICBJbmRlbnRTdmNcbiAgICAgIC5nZXQoe1xuICAgICAgICBpZDogaW5kZW50X2lkXG4gICAgICB9KVxuICAgICAgLiRwcm9taXNlXG4gICAgICAudGhlbihoYW5kbGVyKVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn6I635Y+W6K6i5Y2V5L+h5oGv5aSx6LSl77yM6K+35Yi35paw6YeN6K+VJyk7XG4gICAgICB9KTtcbiAgfSk7IiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudC5lbnVtcycsIFsndXRpbC5lbnVtcycsICdndWx1LmluZGVudC5zdmNzJ10pXG5cbiAgLmZhY3RvcnkoJ0luZGVudEVudW1zJywgZnVuY3Rpb24oRW51bXMsIEluZGVudEVudW1zU3ZjLCB0b2FzdHIpIHtcbiAgICByZXR1cm4gSW5kZW50RW51bXNTdmNcbiAgICAgIC5nZXQoKVxuICAgICAgLiRwcm9taXNlXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgdmFyIGFsbF9wcmVpbnMgPSAnb3JkZXJfdHlwZSBjaGFubmVsIGJyYW5kIHNlcmllcyBzdGF0dXMgY2l0eSBpbnNwZWN0b3Igcm9sZSBmcm9tJy5zcGxpdCgnICcpO1xuXG4gICAgICAgIGFsbF9wcmVpbnMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICByZXNba2V5XS51bnNoaWZ0KHtcbiAgICAgICAgICAgIHRleHQ6ICflhajpg6gnLFxuICAgICAgICAgICAgdmFsdWU6IG51bGxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEVudW1zKHJlcy50b0pTT04oKSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn6I635Y+W5p6a5Li+5aSx6LSlJyk7XG4gICAgICB9KTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuaW5kZW50LnN2Y3MnLCBbJ25nUmVzb3VyY2UnXSlcblxuICAuc2VydmljZSgnSW5kZW50RW51bXNTdmMnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLmNzZXJ2aWNlICsgJy9lbnVtcycpO1xuICB9KVxuICBcbiAgLnNlcnZpY2UoJ0luZGVudHNTdmMnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLmNzZXJ2aWNlICsgJy9vcmRlcnMnLCB7fSwge1xuICAgICAgcXVlcnk6IHtcbiAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50Q3JlYXRlU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXInKTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50U3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50QXNzZXJ0U3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkL2Fzc2VydGVkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VmFsaWRhdGVTdmMnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLmNzZXJ2aWNlICsgJy9vcmRlci86aWQvdmFsaWRhdGVkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VW5yZWFjaFN2YycsIGZ1bmN0aW9uKCRyZXNvdXJjZSkge1xuICAgIHJldHVybiAkcmVzb3VyY2UoQVBJX1NFUlZFUlMuY3NlcnZpY2UgKyAnL29yZGVyLzppZC91bnJlYWNoYWJsZScsIHtcbiAgICAgIGlkOiAnQGlkJ1xuICAgIH0sIHtcbiAgICAgIHVwZGF0ZToge1xuICAgICAgICBtZXRob2Q6ICdQVVQnXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VGVzdGVyU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkL2Fzc2lnbmVkJywge1xuICAgICAgaW5zcGVjdG9yX2lkOiAnQGluc3BlY3Rvcl9pZCdcbiAgICB9LCB7XG4gICAgICB1cGRhdGU6IHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgfVxuICAgIH0pO1xuICB9KVxuXG4gIC5zZXJ2aWNlKCdUZXN0ZXJzU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvYWNjb3VudC9pbnNwZWN0b3JzL2lkbGUnLCB7fSwge1xuICAgICAgcXVlcnk6IHtcbiAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50UmV2b2tlU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXJzLzppZC9yZXZva2VkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7IiwiLyogZ2xvYmFsIGFuZ3VsYXIgKi9cbmFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5pbmRlbnQnKVxuICBcbiAgLmNvbnRyb2xsZXIoJ0luZGVudExpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkbG9jYXRpb24sICRxLCB0b2FzdHIsICRtb2RhbCxcbiAgICBJbmRlbnRzU3ZjLCBJbmRlbnRSZXZva2VTdmMsIEluZGVudEFzc2VydFN2YywgSW5kZW50U3ZjLCBJbmRlbnRFbnVtcykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcbiAgICB2YXIgcXNvID0gJGxvY2F0aW9uLnNlYXJjaCgpO1xuXG4gICAgdm0uc3RhdHVzX2lkID0gcGFyc2VJbnQocXNvLnN0YXR1c19pZCkgfHwgbnVsbDtcbiAgICB2bS5jaXR5X2lkID0gcGFyc2VJbnQocXNvLmNpdHlfaWQpIHx8IG51bGw7XG4gICAgdm0uaW5zcGVjdG9yX2lkID0gcGFyc2VJbnQocXNvLmluc3BlY3Rvcl9pZCkgfHwgbnVsbDtcbiAgICAvLyB2bS5yb2xlX2lkID0gcGFyc2VJbnQocXNvLnJvbGVfaWQpIHx8IG51bGw7XG4gICAgdm0ucmVxdWVzdGVyX21vYmlsZSA9IHFzby5yZXF1ZXN0ZXJfbW9iaWxlIHx8IG51bGw7XG5cbiAgICB2bS5zdGF0dXMgPSBJbmRlbnRFbnVtcy5pdGVtKCdzdGF0dXMnLCB2bS5zdGF0dXNfaWQpO1xuICAgIHZtLnN0YXR1c19saXN0ID0gSW5kZW50RW51bXMubGlzdCgnc3RhdHVzJyk7XG4gICAgdm0uY2l0eSA9IEluZGVudEVudW1zLml0ZW0oJ2NpdHknLCB2bS5jaXR5X2lkKTtcbiAgICB2bS5jaXR5X2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdjaXR5Jyk7XG4gICAgLy8gdm0ucm9sZSA9IEluZGVudEVudW1zLml0ZW0oJ3JvbGUnLCB2bS5yb2xlX2lkKTtcbiAgICAvLyB2bS5yb2xlX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdyb2xlJyk7XG4gICAgdm0uaW5zcGVjdG9yID0gSW5kZW50RW51bXMuaXRlbSgnaW5zcGVjdG9yJywgdm0uaW5zcGVjdG9yX2lkKTtcbiAgICB2bS5pbnNwZWN0b3JfbGlzdCA9IEluZGVudEVudW1zLmxpc3QoJ2luc3BlY3RvcicpO1xuXG4gICAgdm0ucGFnZSA9IHBhcnNlSW50KHFzby5wYWdlKSB8fCAxO1xuICAgIHZtLnNpemUgPSBwYXJzZUludChxc28uc2l6ZSkgfHwgMjA7XG4gICAgdm0uc2l6ZXMgPSBJbmRlbnRFbnVtcy5saXN0KCdzaXplJyk7XG4gICAgdm0uc2l6ZV9pdGVtID0gSW5kZW50RW51bXMuaXRlbSgnc2l6ZScsIHZtLnNpemUpO1xuXG4gICAgdm0uc2l6ZV9jaGFuZ2UgPSBzaXplX2NoYW5nZTtcbiAgICB2bS5wYWdlX2NoYW5nZSA9IHBhZ2VfY2hhbmdlO1xuICAgIHZtLnNlYXJjaCA9IHNlYXJjaDtcbiAgICB2bS5jb25maXJtX29yZGVyID0gY29uZmlybV9vcmRlcjtcbiAgICB2bS5kaXNwYXRjaF90ZXN0ZXIgPSBkaXNwYXRjaF90ZXN0ZXI7XG4gICAgdm0uY2FuY2VsX29yZGVyID0gY2FuY2VsX29yZGVyO1xuICAgIHZtLmFwcHJvdmFsID0gYXBwcm92YWw7XG5cbiAgICBxdWVyeSgpO1xuXG4gICAgZnVuY3Rpb24gcXVlcnkoKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBpdGVtc19wYWdlOiB2bS5zaXplLFxuICAgICAgICBwYWdlOiB2bS5wYWdlLFxuXG4gICAgICAgIHN0YXR1c19pZDogdm0uc3RhdHVzX2lkLFxuICAgICAgICBjaXR5X2lkOiB2bS5jaXR5X2lkLFxuICAgICAgICBpbnNwZWN0b3JfaWQ6IHZtLmluc3BlY3Rvcl9pZCxcbiAgICAgICAgLy8gcm9sZV9pZDogdm0ucm9sZV9pZCxcbiAgICAgICAgcmVxdWVzdGVyX21vYmlsZTogdm0ucmVxdWVzdGVyX21vYmlsZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJGxvY2F0aW9uLnNlYXJjaChwYXJhbXMpO1xuXG4gICAgICBJbmRlbnRzU3ZjXG4gICAgICAgIC5xdWVyeShwYXJhbXMpXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihycykge1xuICAgICAgICAgIHJzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zdGF0dXNfdGV4dCA9IEluZGVudEVudW1zLnRleHQoJ3N0YXR1cycsIGl0ZW0uc3RhdHVzX2lkKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZtLml0ZW1zID0gcnMuaXRlbXM7XG4gICAgICAgICAgdm0udG90YWxfY291bnQgPSBycy50b3RhbF9jb3VudDtcblxuICAgICAgICAgIHZhciB0bXAgPSBycy50b3RhbF9jb3VudCAvIHZtLnNpemU7XG4gICAgICAgICAgdm0ucGFnZV9jb3VudCA9IHJzLnRvdGFsX2NvdW50ICUgdm0uc2l6ZSA9PT0gMCA/IHRtcCA6IChNYXRoLmZsb29yKHRtcCkgKyAxKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMuZGF0YS5tc2cgfHwgJ+afpeivouWksei0pe+8jOacjeWKoeWZqOWPkeeUn+acquefpemUmeivr++8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2bS4kd2F0Y2hDb2xsZWN0aW9uKCdpdGVtcycsIGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICB2bS5pdGVtcyA9IGl0ZW1zO1xuICAgIH0pO1xuXG4gICAgd2F0Y2hfbGlzdCgnc3RhdHVzJywgJ3N0YXR1c19pZCcpO1xuICAgIHdhdGNoX2xpc3QoJ2NpdHknLCAnY2l0eV9pZCcpO1xuICAgIC8vIHdhdGNoX2xpc3QoJ3JvbGUnLCAncm9sZV9pZCcpO1xuICAgIHdhdGNoX2xpc3QoJ2luc3BlY3RvcicsICdpbnNwZWN0b3JfaWQnKTtcblxuICAgIGZ1bmN0aW9uIHdhdGNoX2xpc3QobmFtZSwgZmllbGQpIHtcbiAgICAgIHZtLiR3YXRjaChuYW1lLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtW2ZpZWxkXSA9IGl0ZW0udmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDnoa7orqTorqLljZVcbiAgICBmdW5jdGlvbiBjb25maXJtX29yZGVyKGl0ZW0pIHtcbiAgICAgIEluZGVudEFzc2VydFN2Y1xuICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5bey56Gu6K6k6K+l6K6i5Y2VJyk7XG5cbiAgICAgICAgICAkbG9jYXRpb24udXJsKCcvaW5kZW50cy8nICsgaXRlbS5pZCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn56Gu6K6k6K+l6K6i5Y2V5aSx6LSlJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWIhumFjeajgOa1i+W4iFxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoX3Rlc3RlcihpdGVtKSB7XG4gICAgICB2YXIgZGlzcGF0Y2hfdGVzdGVyX2lucyA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvZGlzcGF0Y2hfdGVzdGVyLmh0bScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEaXNwYXRjaEN0cmwnLFxuICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBpbmRlbnRfaW5mbzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkaXNwYXRjaF90ZXN0ZXJfaW5zLnJlc3VsdC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBxdWVyeSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5Y+W5raI6K6i5Y2VXG4gICAgZnVuY3Rpb24gY2FuY2VsX29yZGVyKGl0ZW0pIHtcbiAgICAgIHZhciBjYW5jZWxfb3JkZXJfaW5zID0gJG1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ2luZGVudC9jYW5jZWxfb3JkZXIuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhbmNlbE9yZGVyQ3RybCcsXG4gICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgIGluZGVudF9pbmZvOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNhbmNlbF9vcmRlcl9pbnMucmVzdWx0LnRoZW4oZnVuY3Rpb24odGVzdGVyKSB7XG4gICAgICAgIC8vIFRPRE86XG4gICAgICAgIC8vIOabtOaWsOmihOe6puWNleeKtuaAgVxuICAgICAgICBxdWVyeSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5a6h5qC45Y+W5raIXG4gICAgZnVuY3Rpb24gYXBwcm92YWwoaXRlbSkge1xuICAgICAgaWYgKGNvbmZpcm0oJ+ehruiupOWQjOaEj+WPlua2iOivpeiuouWNle+8nycpKSB7XG4gICAgICAgIEluZGVudFJldm9rZVN2Y1xuICAgICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KVxuICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5ZCM5oSP5Y+W5raI6K+l6K6i5Y2V77yM5pON5L2c5oiQ5YqfJyk7XG5cbiAgICAgICAgICAgIHF1ZXJ5KCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5o+Q5Lqk5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5q+P6aG15p2h5pWw5pS55Y+YXG4gICAgZnVuY3Rpb24gc2l6ZV9jaGFuZ2Uoc2l6ZSkge1xuICAgICAgdm0uc2l6ZSA9IHNpemU7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDnv7vpobVcbiAgICBmdW5jdGlvbiBwYWdlX2NoYW5nZShwYWdlKSB7XG4gICAgICB2bS5wYWdlID0gcGFnZTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDmn6Xor6Lmj5DkuqRcbiAgICBmdW5jdGlvbiBzZWFyY2goKSB7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG4gIH0pXG4gIFxuICAvLyDlvoXlrqHmibnliJfooahcbiAgLmNvbnRyb2xsZXIoJ0luZGVudEFwcHJvdmFsTGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRsb2NhdGlvbiwgdG9hc3RyLCBJbmRlbnRzU3ZjLCBJbmRlbnRSZXZva2VTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuICAgIHZhciBxc28gPSAkbG9jYXRpb24uc2VhcmNoKCk7XG4gICAgXG4gICAgdm0ucGFnZSA9IHBhcnNlSW50KHFzby5wYWdlKSB8fCAxO1xuICAgIHZtLnNpemUgPSBwYXJzZUludChxc28uc2l6ZSkgfHwgMjA7XG4gICAgdm0uc2l6ZXMgPSBJbmRlbnRFbnVtcy5saXN0KCdzaXplJyk7XG4gICAgdm0uc2l6ZV9pdGVtID0gSW5kZW50RW51bXMuaXRlbSgnc2l6ZScsIHZtLnNpemUpO1xuXG4gICAgdm0uc2l6ZV9jaGFuZ2UgPSBzaXplX2NoYW5nZTtcbiAgICB2bS5wYWdlX2NoYW5nZSA9IHBhZ2VfY2hhbmdlO1xuICAgIHZtLmFwcHJvdmFsID0gYXBwcm92YWw7XG5cbiAgICBxdWVyeSgpO1xuXG4gICAgZnVuY3Rpb24gcXVlcnkoKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBpdGVtc19wYWdlOiB2bS5zaXplLFxuICAgICAgICBwYWdlOiB2bS5wYWdlLFxuICAgICAgICBzdGF0dXNfaWQ6IDNcbiAgICAgIH07XG4gICAgICBcbiAgICAgICRsb2NhdGlvbi5zZWFyY2gocGFyYW1zKTtcblxuICAgICAgSW5kZW50c1N2Y1xuICAgICAgICAucXVlcnkocGFyYW1zKVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnMpIHtcbiAgICAgICAgICBycy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc3RhdHVzX3RleHQgPSBJbmRlbnRFbnVtcy50ZXh0KCdzdGF0dXMnLCBpdGVtLnN0YXR1c19pZCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2bS5pdGVtcyA9IHJzLml0ZW1zO1xuICAgICAgICAgIHZtLnRvdGFsX2NvdW50ID0gcnMudG90YWxfY291bnQ7XG5cbiAgICAgICAgICB2YXIgdG1wID0gcnMudG90YWxfY291bnQgLyB2bS5zaXplO1xuICAgICAgICAgIHZtLnBhZ2VfY291bnQgPSBycy50b3RhbF9jb3VudCAlIHZtLnNpemUgPT09IDAgPyB0bXAgOiAoTWF0aC5mbG9vcih0bXApICsgMSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLmRhdGEubXNnIHx8ICfmn6Xor6LlpLHotKXvvIzmnI3liqHlmajlj5HnlJ/mnKrnn6XplJnor6/vvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5a6h5qC45Y+W5raIXG4gICAgZnVuY3Rpb24gYXBwcm92YWwoaXRlbSkge1xuICAgICAgaWYgKGNvbmZpcm0oJ+ehruiupOWQjOaEj+WPlua2iOivpeiuouWNle+8nycpKSB7XG4gICAgICAgIEluZGVudFJldm9rZVN2Y1xuICAgICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KVxuICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5ZCM5oSP5Y+W5raI6K+l6K6i5Y2V77yM5pON5L2c5oiQ5YqfJyk7XG5cbiAgICAgICAgICAgIHF1ZXJ5KCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5o+Q5Lqk5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5q+P6aG15p2h5pWw5pS55Y+YXG4gICAgZnVuY3Rpb24gc2l6ZV9jaGFuZ2Uoc2l6ZSkge1xuICAgICAgdm0uc2l6ZSA9IHNpemU7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDnv7vpobVcbiAgICBmdW5jdGlvbiBwYWdlX2NoYW5nZShwYWdlKSB7XG4gICAgICB2bS5wYWdlID0gcGFnZTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgfSlcblxuICAvLyDliIbphY3mo4DmtYvluIhcbiAgLmNvbnRyb2xsZXIoJ0Rpc3BhdGNoQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UsIHRvYXN0ciwgSW5kZW50VGVzdGVyU3ZjLCBUZXN0ZXJzU3ZjLCBpbmRlbnRfaW5mbykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcblxuICAgIGFuZ3VsYXIuZXh0ZW5kKHZtLCBpbmRlbnRfaW5mbyk7XG5cbiAgICB2bS5wYWdlID0gMTtcbiAgICB2bS5xdWVyeSA9IHF1ZXJ5O1xuXG4gICAgdm0uY2FuY2VsID0gY2FuY2VsO1xuICAgIHZtLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5cbiAgICBxdWVyeSgxKTtcblxuICAgIGZ1bmN0aW9uIHF1ZXJ5KHBhZ2UpIHtcbiAgICAgIHZtLnBhZ2UgPSBwYWdlO1xuXG4gICAgICBUZXN0ZXJzU3ZjXG4gICAgICAgIC5xdWVyeSh7XG4gICAgICAgICAgdGltZTogaW5kZW50X2luZm8udGVzdF90aW1lLFxuICAgICAgICAgIHBhZ2U6IHBhZ2VcbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHZtLml0ZW1zID0gcmVzLml0ZW1zO1xuICAgICAgICAgIHZtLnRvdGFsX2NvdW50ID0gcmVzLnRvdGFsX2NvdW50O1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+iOt+WPluepuuaho+acn+ajgOa1i+W4iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwYXRjaCh0ZXN0ZXIpIHtcbiAgICAgIHZtLmRpc3BhdGNoX3N0YXR1cyA9IHRydWU7XG5cbiAgICAgIEluZGVudFRlc3RlclN2Y1xuICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICBpZDogaW5kZW50X2luZm8uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIGluc3BlY3Rvcl9pZDogdGVzdGVyLmlkXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICfliIbphY3mo4DmtYvluIjmiJDlip8nKTtcblxuICAgICAgICAgICRtb2RhbEluc3RhbmNlLmNsb3NlKHRlc3Rlcik7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB2bS5kaXNwYXRjaF9zdGF0dXMgPSBmYWxzZTtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5YiG6YWN5qOA5rWL5biI5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgICRtb2RhbEluc3RhbmNlLmRpc21pc3MoKTtcbiAgICB9XG4gIH0pXG4gIFxuICAvLyDlj5bmtojorqLljZVcbiAgLmNvbnRyb2xsZXIoJ0NhbmNlbE9yZGVyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UsIHRvYXN0ciwgSW5kZW50U3ZjLCBpbmRlbnRfaW5mbykge1xuICAgIHZhciB2bSA9ICRzY29wZTtcblxuICAgIGFuZ3VsYXIuZXh0ZW5kKHZtLCBpbmRlbnRfaW5mbyk7XG5cbiAgICB2bS5jYW5jZWxfb3JkZXIgPSBjYW5jZWxfb3JkZXI7XG4gICAgdm0uY2FuY2VsID0gY2FuY2VsO1xuXG4gICAgZnVuY3Rpb24gY2FuY2VsX29yZGVyKCkge1xuICAgICAgdm0uY2FuY2VsX29yZGVyX3N0YXR1cyA9IHRydWU7XG5cbiAgICAgIEluZGVudFN2Y1xuICAgICAgICAucmVtb3ZlKHtcbiAgICAgICAgICBpZDogaW5kZW50X2luZm8uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIHJlYXNvbjogdm0ucmVhc29uXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICforqLljZXlj5bmtojmiJDlip8nKTtcblxuICAgICAgICAgICRtb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB2bS5jYW5jZWxfb3JkZXJfc3RhdHVzID0gZmFsc2U7XG5cbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn6K6i5Y2V5Y+W5raI5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgICRtb2RhbEluc3RhbmNlLmRpc21pc3MoKTtcbiAgICB9XG4gIH0pO1xuXG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUubG9naW4nKVxuICBcbiAgLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRxLCAkbG9jYXRpb24sICR0aW1lb3V0LCB0b2FzdHIsIExvZ2luU3ZjKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuXG4gICAgdm0ubG9naW4gPSBsb2dpbjtcblxuICAgIGZ1bmN0aW9uIGxvZ2luKCkge1xuICAgICAgcmV0dXJuIExvZ2luU3ZjXG4gICAgICAgIC5zYXZlKHtcbiAgICAgICAgICB1c2VybmFtZTogdm0uam9iX25vLFxuICAgICAgICAgIHBhc3N3b3JkOiB2bS5wYXNzd29yZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKGRhdGEubXNnIHx8ICfnmbvlvZXmiJDlip/vvIzmraPlnKjkuLrkvaDot7PovawuLi4nKTtcblxuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL2luZGVudHMnKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfnmbvlvZXlpLHotKXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUubG9naW4uc3ZjcycsIFsnbmdSZXNvdXJjZSddKVxuICAuc2VydmljZSgnTG9naW5TdmMnLCBmdW5jdGlvbiAoJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy50ZXN0ZXIgKyAnL3N0YWZmX2xvZ2luJyk7XG4gIH0pIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9