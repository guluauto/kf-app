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
    'LocalStorageModule',
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
  .config(["$locationProvider", "$urlRouterProvider", "$stateProvider", "localStorageServiceProvider", function($locationProvider, $urlRouterProvider, $stateProvider, localStorageServiceProvider) {
    // not use html5 history api
    // but use hashbang
    $locationProvider
      .html5Mode(false)
      .hashPrefix('!');

    // define 404
    $urlRouterProvider
      .otherwise('/login');

    // localStorage prefix
    localStorageServiceProvider
      .setPrefix('gulu.kf')
      .setNotify(true, true);

    // API Server
    API_SERVERS = {
      cservice: 'http://cs.guluabc.com'
      // cservice: 'http://t.ifdiu.com'
    };

    angular.element(document).on('deviceready', function() {
      angular.element(document).on('backbutton', function(e) {
        e.preventDefault();

        return false;
      });
    });
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
    'util.oauth',
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

angular
  .module('gulu.indent')
  
  .controller('IndentCtrl', ["$scope", "$rootScope", "$location", "$timeout", "$filter", "toastr", "DateUtil", "IndentsSvc", "IndentCreateSvc", "IndentUnreachSvc", "IndentSvc", "IndentValidateSvc", "IndentEnums", function($scope, $rootScope, $location, $timeout,
    $filter, toastr, DateUtil, IndentsSvc, IndentCreateSvc, IndentUnreachSvc, IndentSvc,
    IndentValidateSvc, IndentEnums) {
    var vm = $scope;

    var indent_id = vm.$stateParams.indent_id;

    vm.type_list = IndentEnums.list('order_type');
    // vm.channel_list = IndentEnums.list('channel');
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
          contact: {
            name: vm.contact_name,
            mobile: vm.contact_mobile.replace(/[\s\-]+/g, '')
          },
          appointment_time: vm.appointment_time,
          address: vm.address,
          memo: vm.memo
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
        }, {
          memo: vm.memo
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
      // select_item('channel', vm.channel);
      // select_item('brand', vm.car.brand);
      // select_item('series', vm.car.series);
    }
    function handler(res) {
      angular.extend(vm, res.toJSON());

      if (vm.appointment_time) {
        var appointment_time_sp = vm.appointment_time.split(' ');

        vm.appointment_time_before = appointment_time_sp[0];
        vm.appointment_time_after = new Date(vm.appointment_time);
      }

      vm.contact_name = vm.contact.name;
      vm.contact_mobile = vm.contact.mobile;

      set_selected_item();
      watch_appointment_time_part();
    }

    // 新建预约单
    if (indent_id == 0) {
      return IndentCreateSvc
        .save({
          // 来源：电话
          order_through: 2
        })
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
        var all_preins = 'order_type order_status city inspector user_type order_through'.split(' ');

        all_preins.forEach(function(key) {
          res[key].unshift({
            text: '全部',
            value: null
          });
        });

        res['size'] = [{
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
        }];

        return Enums(res.toJSON());
      })
      .catch(function(res) {
        toastr.error(res.msg || '获取枚举失败');
      });
  }]);

angular
  .module('gulu.indent.svcs', ['ngResource'])

  .service('IndentEnumsSvc', ["$resource", function($resource) {
    return $resource(API_SERVERS.cservice + '/parameters');
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
    return $resource(API_SERVERS.cservice + '/order/:id/revoked', {
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
    vm.contact_mobile = qso.contact_mobile || null;

    vm.status = IndentEnums.item('order_status', vm.status_id);
    vm.status_list = IndentEnums.list('order_status');
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
        contact_mobile: vm.contact_mobile
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.order_through_text = IndentEnums.text('order_through', item.order_through);
            item.status_text = IndentEnums.text('order_status', item.status_id);
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

    watch_list('order_status', 'status_id');
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
        status_id: 5
      };
      
      $location.search(params);

      IndentsSvc
        .query(params)
        .$promise
        .then(function(rs) {
          rs.items.forEach(function(item) {
            item.order_through_text = IndentEnums.text('order_through', item.order_through);
            item.status_text = IndentEnums.text('order_status', item.status_id);
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
          city_id: 0,
          appointment_time: indent_info.appointment_time,
          page: page,
          items_page: 15
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
          id: indent_info.id,
          memo: vm.reason
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
  .module('httpInterceptors', ['LocalStorageModule', 'util.oauth'])

  .config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
    
    // Angular $http isn’t appending the header X-Requested-With = XMLHttpRequest since Angular 1.3.0
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  }])

  .factory('httpInterceptor', ["$q", "$rootScope", "$location", "OAuth", function($q, $rootScope, $location, OAuth) {
    return {
      // 请求前修改 request 配置
      'request': function(config) {
        angular.extend(config.headers, OAuth.headers());
        
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
        var current_path = $location.path();

        if (angular.isObject(response.data)) {
          // 若响应数据不符合约定
          if (response.data.code == null) {
            return response;
          }

          code = response.data.code;
          data = response.data.data;

          // 若 status 200, 且 code !200，则返回的是操作错误提示信息
          // 那么，callback 会接收到下面形式的参数：
          // { code: 20001, msg: '操作失败' }
          if (code !== 200) {
            if (code === 401) {
              OAuth.r401(current_path);
            }

            return $q.reject(response.data);
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
        var current_path = $location.path();

        if (rejection.status === 401) {
          OAuth.r401(current_path);
        }

        return $q.reject(rejection);
      }
    };
  }]);
/* global angular*/
angular
  .module('util.oauth', ['LocalStorageModule'])
  .factory('OAuth', ["$log", "$location", "localStorageService", function($log, $location, localStorageService) {
    var oauth_local_key = 'oauth';

    var oauth_conf = {
      client_id: 'Xeax2OMgeLQPDxfSlrIZ3BZqtFHMnBWIhpAKO7aj',
      client_secret: 'qB5fN7KfHya00ApzP9plIr3upBZoRUvi3hba8DDMf4OS8bHXRfC3Q0gGJBqNs1WnhFffFZwKVaMaAIs7vcZh4jMzbXEjFrJIZ3IpcV7cAxQovW2hUT9qmQKhjO8nAsIM',
      grant_type: 'password'
    };

    var OAuth = {
      conf: function() {
        return oauth_conf;
      },

      r401: function(cur_path) {
        $location.url('/login');
        $location.search('redirect', cur_path);
      },

      headers: function() {
        var tokens = this.local();
        var headers = {};

        if (tokens) {
          headers.Authorization = tokens.token_type + ' ' + tokens.access_token;
        }

        return headers;
      },

      local: function(tokens) {
        if (tokens) {
          localStorageService.set(oauth_local_key, tokens);

          return tokens;
        }

        return localStorageService.get(oauth_local_key);
      }
    };

    return OAuth;
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
  .module('gulu.login')
  
  .controller('LoginCtrl', ["$scope", "$q", "$location", "$timeout", "toastr", "LoginSvc", "OAuth", function ($scope, $q, $location, $timeout, toastr, LoginSvc, OAuth) {
    var vm = $scope;

    vm.login = login;

    function login() {
      return LoginSvc
        .save(angular.extend(OAuth.conf(), {
          username: vm.job_no,
          password: vm.password
        }))
        .$promise
        .then(function(res) {
          OAuth.local(res.toJSON());

          toastr.success(res.msg || '登录成功，正在为你跳转...');

          var qs = $location.search();
          $location.url(qs.redirect || '/indents');
        })
        .catch(function(res) {
          toastr.error(res.msg || '登录失败，请重试');
        });
    }
  }]);
angular
  .module('gulu.login.svcs', ['ngResource'])
  .service('LoginSvc', ["$resource", function ($resource) {
    return $resource(API_SERVERS.cservice + '/oauth2/token', null, {
      save: {
        method: 'POST',
        
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        
        transformRequest: function(data) {
          var str = [];
          
          angular.forEach(data, function(value, key) {
            this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
          }, str);

          return str.join('&');
        }
      }
    });
  }])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNsaWVudC1zZXJ2aWNlL2NsaWVudF9zZXJ2aWNlX21vZHVsZS5qcyIsImluZGVudC9pbmRlbnRfbW9kdWxlLmpzIiwibG9naW4vbG9naW5fbW9kdWxlLmpzIiwiNDA0LzQwNF9jdHJsLmpzIiwiaW5kZW50L2VkaXRfY3RybC5qcyIsImluZGVudC9lbnVtcy5qcyIsImluZGVudC9pbmRlbnRfc3Zjcy5qcyIsImluZGVudC9saXN0X2N0cmwuanMiLCJjb21wb25lbnQvY3VzdG9tLWRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudC9jdXN0b20tZmlsdGVyLmpzIiwiY29tcG9uZW50L2RhdGUuanMiLCJjb21wb25lbnQvZW51bXMuanMiLCJjb21wb25lbnQvaHR0cC5qcyIsImNvbXBvbmVudC9vYXV0aC5qcyIsImNvbXBvbmVudC96aC1jbi5qcyIsImxvZ2luL2xvZ2luX2N0cmwuanMiLCJsb2dpbi9sb2dpbl9zdmNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUFNQTtHQUNBLE9BQUEsUUFBQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBOztHQUVBLG9HQUFBLFNBQUEsbUJBQUEsb0JBQUEsZ0JBQUEsNkJBQUE7OztJQUdBO09BQ0EsVUFBQTtPQUNBLFdBQUE7OztJQUdBO09BQ0EsVUFBQTs7O0lBR0E7T0FDQSxVQUFBO09BQ0EsVUFBQSxNQUFBOzs7SUFHQSxjQUFBO01BQ0EsVUFBQTs7OztJQUlBLFFBQUEsUUFBQSxVQUFBLEdBQUEsZUFBQSxXQUFBO01BQ0EsUUFBQSxRQUFBLFVBQUEsR0FBQSxjQUFBLFNBQUEsR0FBQTtRQUNBLEVBQUE7O1FBRUEsT0FBQTs7OztHQUlBLDBEQUFBLFNBQUEsWUFBQSxXQUFBLFFBQUEsY0FBQTtJQUNBLElBQUEsTUFBQTs7SUFFQSxXQUFBLFNBQUE7SUFDQSxXQUFBLGVBQUE7OztJQUdBO09BQ0EsT0FBQSxXQUFBO1FBQ0EsT0FBQSxVQUFBO1NBQ0EsU0FBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLFFBQUEsUUFBQSxLQUFBLFFBQUEsSUFBQSxRQUFBLEtBQUEsS0FBQTtVQUNBOzs7UUFHQSxXQUFBLFVBQUE7OztJQUdBLFdBQUEsT0FBQSxXQUFBO01BQ0EsVUFBQSxJQUFBLFdBQUE7Ozs7O0FDdkVBO0dBQ0EsT0FBQSx1QkFBQTtJQUNBO0lBQ0E7O0dBRUEsMEJBQUEsU0FBQSxnQkFBQTtJQUNBO09BQ0EsTUFBQSxrQkFBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFNBQUE7VUFDQSxhQUFBOzs7T0FHQSxNQUFBLHVCQUFBO1FBQ0EsS0FBQTtRQUNBLGFBQUE7UUFDQSxZQUFBOztPQUVBLE1BQUEsMkJBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7O09BRUEsTUFBQSx5QkFBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7OztBQzVCQTtHQUNBLE9BQUEsZUFBQTtJQUNBO0lBQ0E7OztBQ0hBO0dBQ0EsT0FBQSxjQUFBO0lBQ0E7SUFDQTtJQUNBOzs7R0FHQSwwQkFBQSxTQUFBLGdCQUFBO0lBQ0E7T0FDQSxNQUFBLFNBQUE7UUFDQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7Ozs7Ozs7O0FDUkE7R0FDQSxPQUFBLGdCQUFBLENBQUE7OztHQUdBLDBCQUFBLFVBQUEsZ0JBQUE7SUFDQTtPQUNBLE1BQUEsV0FBQTtRQUNBLEtBQUE7UUFDQSxhQUFBO1FBQ0EsWUFBQTs7Ozs7R0FLQSxXQUFBLDBCQUFBLFVBQUEsUUFBQTtJQUNBLFFBQUEsSUFBQTs7Ozs7QUNuQkE7R0FDQSxPQUFBOztHQUVBLFdBQUEsdU1BQUEsU0FBQSxRQUFBLFlBQUEsV0FBQTtJQUNBLFNBQUEsUUFBQSxVQUFBLFlBQUEsaUJBQUEsa0JBQUE7SUFDQSxtQkFBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBOztJQUVBLElBQUEsWUFBQSxHQUFBLGFBQUE7O0lBRUEsR0FBQSxZQUFBLFlBQUEsS0FBQTs7Ozs7SUFLQSxHQUFBLFNBQUE7SUFDQSxHQUFBLFNBQUE7SUFDQSxHQUFBLGlCQUFBO0lBQ0EsR0FBQSxrQkFBQTs7SUFFQSxTQUFBLFNBQUE7TUFDQSxPQUFBO1NBQ0EsT0FBQTtVQUNBLElBQUEsR0FBQTtXQUNBO1VBQ0EsU0FBQSxHQUFBLFdBQUE7VUFDQSxTQUFBO1lBQ0EsTUFBQSxHQUFBO1lBQ0EsUUFBQSxHQUFBLGVBQUEsUUFBQSxZQUFBOztVQUVBLGtCQUFBLEdBQUE7VUFDQSxTQUFBLEdBQUE7VUFDQSxNQUFBLEdBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsUUFBQSxJQUFBLE9BQUE7O1VBRUEsU0FBQSxXQUFBO1lBQ0EsV0FBQTthQUNBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7OztJQUlBLFNBQUEsZ0JBQUEsUUFBQTtNQUNBLE9BQUE7TUFDQSxPQUFBOztNQUVBLEdBQUEsd0JBQUE7OztJQUdBLFNBQUEsU0FBQTtNQUNBO1NBQ0EsT0FBQTtVQUNBLElBQUEsR0FBQTtXQUNBO1VBQ0EsTUFBQSxHQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFNBQUEsV0FBQTtZQUNBLFdBQUE7YUFDQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7SUFJQSxTQUFBLGlCQUFBO01BQ0E7U0FDQSxPQUFBO1VBQ0EsSUFBQSxHQUFBO1dBQ0E7VUFDQSxNQUFBLEdBQUE7O1NBRUE7U0FDQSxLQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsUUFBQSxJQUFBLE9BQUE7O1VBRUEsV0FBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7SUFJQSxTQUFBLFlBQUEsV0FBQSxPQUFBO01BQ0EsR0FBQSxhQUFBLFlBQUEsS0FBQSxXQUFBOzs7SUFHQSxTQUFBLDhCQUFBO01BQ0EsR0FBQSxPQUFBLDJCQUFBLFNBQUEseUJBQUE7UUFDQSxJQUFBLDJCQUFBLENBQUEsR0FBQSxVQUFBLHdCQUFBLFdBQUE7VUFDQSxHQUFBLHlCQUFBLElBQUEsS0FBQTs7OztNQUlBLEdBQUEsT0FBQSwwQkFBQSxTQUFBLHdCQUFBO1FBQ0EsSUFBQSwwQkFBQSxDQUFBLEdBQUEsVUFBQSx1QkFBQSxXQUFBO1VBQ0EsR0FBQSxtQkFBQSxTQUFBLGtCQUFBOzs7OztJQUtBLFNBQUEsb0JBQUE7TUFDQSxZQUFBLGNBQUEsR0FBQTs7Ozs7SUFLQSxTQUFBLFFBQUEsS0FBQTtNQUNBLFFBQUEsT0FBQSxJQUFBLElBQUE7O01BRUEsSUFBQSxHQUFBLGtCQUFBO1FBQ0EsSUFBQSxzQkFBQSxHQUFBLGlCQUFBLE1BQUE7O1FBRUEsR0FBQSwwQkFBQSxvQkFBQTtRQUNBLEdBQUEseUJBQUEsSUFBQSxLQUFBLEdBQUE7OztNQUdBLEdBQUEsZUFBQSxHQUFBLFFBQUE7TUFDQSxHQUFBLGlCQUFBLEdBQUEsUUFBQTs7TUFFQTtNQUNBOzs7O0lBSUEsSUFBQSxhQUFBLEdBQUE7TUFDQSxPQUFBO1NBQ0EsS0FBQTs7VUFFQSxlQUFBOztTQUVBO1NBQ0EsS0FBQTtTQUNBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7Ozs7SUFLQTtPQUNBLElBQUE7UUFDQSxJQUFBOztPQUVBO09BQ0EsS0FBQTtPQUNBLE1BQUEsU0FBQSxLQUFBO1FBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7O0FDM0pBO0dBQ0EsT0FBQSxxQkFBQSxDQUFBLGNBQUE7O0dBRUEsUUFBQSxxREFBQSxTQUFBLE9BQUEsZ0JBQUEsUUFBQTtJQUNBLE9BQUE7T0FDQTtPQUNBO09BQ0EsS0FBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLGFBQUEsaUVBQUEsTUFBQTs7UUFFQSxXQUFBLFFBQUEsU0FBQSxLQUFBO1VBQ0EsSUFBQSxLQUFBLFFBQUE7WUFDQSxNQUFBO1lBQ0EsT0FBQTs7OztRQUlBLElBQUEsVUFBQSxDQUFBO1VBQ0EsTUFBQTtVQUNBLE9BQUE7V0FDQTtVQUNBLE1BQUE7VUFDQSxPQUFBO1dBQ0E7VUFDQSxNQUFBO1VBQ0EsT0FBQTtXQUNBO1VBQ0EsTUFBQTtVQUNBLE9BQUE7V0FDQTtVQUNBLE1BQUE7VUFDQSxPQUFBOzs7UUFHQSxPQUFBLE1BQUEsSUFBQTs7T0FFQSxNQUFBLFNBQUEsS0FBQTtRQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7QUNyQ0E7R0FDQSxPQUFBLG9CQUFBLENBQUE7O0dBRUEsUUFBQSxnQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBOzs7R0FHQSxRQUFBLDRCQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFdBQUEsV0FBQSxJQUFBO01BQ0EsT0FBQTtRQUNBLFNBQUE7Ozs7O0dBS0EsUUFBQSxpQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBOzs7R0FHQSxRQUFBLDJCQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFdBQUEsY0FBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsaUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx1QkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsbUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx3QkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsa0NBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSwwQkFBQTtNQUNBLElBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsaUNBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSx1QkFBQTtNQUNBLGNBQUE7T0FDQTtNQUNBLFFBQUE7UUFDQSxRQUFBOzs7OztHQUtBLFFBQUEsNEJBQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxVQUFBLFlBQUEsV0FBQSw0QkFBQSxJQUFBO01BQ0EsT0FBQTtRQUNBLFNBQUE7Ozs7O0dBS0EsUUFBQSxpQ0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFVBQUEsWUFBQSxXQUFBLHNCQUFBO01BQ0EsSUFBQTtPQUNBO01BQ0EsUUFBQTtRQUNBLFFBQUE7Ozs7O0FDakZBO0dBQ0EsT0FBQTs7R0FFQSxXQUFBLG9KQUFBLFNBQUEsUUFBQSxXQUFBLElBQUEsUUFBQTtJQUNBLFlBQUEsaUJBQUEsaUJBQUEsV0FBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBO0lBQ0EsSUFBQSxNQUFBLFVBQUE7O0lBRUEsR0FBQSxZQUFBLFNBQUEsSUFBQSxjQUFBO0lBQ0EsR0FBQSxVQUFBLFNBQUEsSUFBQSxZQUFBO0lBQ0EsR0FBQSxlQUFBLFNBQUEsSUFBQSxpQkFBQTs7SUFFQSxHQUFBLGlCQUFBLElBQUEsa0JBQUE7O0lBRUEsR0FBQSxTQUFBLFlBQUEsS0FBQSxnQkFBQSxHQUFBO0lBQ0EsR0FBQSxjQUFBLFlBQUEsS0FBQTtJQUNBLEdBQUEsT0FBQSxZQUFBLEtBQUEsUUFBQSxHQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQTs7O0lBR0EsR0FBQSxZQUFBLFlBQUEsS0FBQSxhQUFBLEdBQUE7SUFDQSxHQUFBLGlCQUFBLFlBQUEsS0FBQTs7SUFFQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLFFBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQSxRQUFBLEdBQUE7O0lBRUEsR0FBQSxjQUFBO0lBQ0EsR0FBQSxjQUFBO0lBQ0EsR0FBQSxTQUFBO0lBQ0EsR0FBQSxnQkFBQTtJQUNBLEdBQUEsa0JBQUE7SUFDQSxHQUFBLGVBQUE7SUFDQSxHQUFBLFdBQUE7O0lBRUE7O0lBRUEsU0FBQSxRQUFBO01BQ0EsSUFBQSxTQUFBO1FBQ0EsWUFBQSxHQUFBO1FBQ0EsTUFBQSxHQUFBOztRQUVBLFdBQUEsR0FBQTtRQUNBLFNBQUEsR0FBQTtRQUNBLGNBQUEsR0FBQTs7UUFFQSxnQkFBQSxHQUFBOzs7TUFHQSxVQUFBLE9BQUE7O01BRUE7U0FDQSxNQUFBO1NBQ0E7U0FDQSxLQUFBLFNBQUEsSUFBQTtVQUNBLEdBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQTtZQUNBLEtBQUEscUJBQUEsWUFBQSxLQUFBLGlCQUFBLEtBQUE7WUFDQSxLQUFBLGNBQUEsWUFBQSxLQUFBLGdCQUFBLEtBQUE7OztVQUdBLEdBQUEsUUFBQSxHQUFBO1VBQ0EsR0FBQSxjQUFBLEdBQUE7O1VBRUEsSUFBQSxNQUFBLEdBQUEsY0FBQSxHQUFBO1VBQ0EsR0FBQSxhQUFBLEdBQUEsY0FBQSxHQUFBLFNBQUEsSUFBQSxPQUFBLEtBQUEsTUFBQSxPQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsS0FBQSxPQUFBOzs7O0lBSUEsR0FBQSxpQkFBQSxTQUFBLFNBQUEsT0FBQTtNQUNBLEdBQUEsUUFBQTs7O0lBR0EsV0FBQSxnQkFBQTtJQUNBLFdBQUEsUUFBQTs7SUFFQSxXQUFBLGFBQUE7O0lBRUEsU0FBQSxXQUFBLE1BQUEsT0FBQTtNQUNBLEdBQUEsT0FBQSxNQUFBLFNBQUEsTUFBQTtRQUNBLElBQUEsQ0FBQSxNQUFBO1VBQ0E7OztRQUdBLEdBQUEsU0FBQSxLQUFBOzs7OztJQUtBLFNBQUEsY0FBQSxNQUFBO01BQ0E7U0FDQSxPQUFBO1VBQ0EsSUFBQSxLQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLFVBQUEsSUFBQSxjQUFBLEtBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7OztJQUtBLFNBQUEsZ0JBQUEsTUFBQTtNQUNBLElBQUEsc0JBQUEsT0FBQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7UUFDQSxVQUFBO1FBQ0EsU0FBQTtVQUNBLGFBQUEsV0FBQTtZQUNBLE9BQUE7Ozs7O01BS0Esb0JBQUEsT0FBQSxLQUFBLFdBQUE7UUFDQTs7Ozs7SUFLQSxTQUFBLGFBQUEsTUFBQTtNQUNBLElBQUEsbUJBQUEsT0FBQSxLQUFBO1FBQ0EsYUFBQTtRQUNBLFlBQUE7UUFDQSxVQUFBO1FBQ0EsU0FBQTtVQUNBLGFBQUEsV0FBQTtZQUNBLE9BQUE7Ozs7O01BS0EsaUJBQUEsT0FBQSxLQUFBLFNBQUEsUUFBQTtRQUNBOzs7OztJQUtBLFNBQUEsU0FBQSxNQUFBO01BQ0EsSUFBQSxRQUFBLGVBQUE7UUFDQTtXQUNBLE9BQUE7WUFDQSxJQUFBLEtBQUE7O1dBRUE7V0FDQSxLQUFBLFNBQUEsS0FBQTtZQUNBLE9BQUEsUUFBQSxJQUFBLE9BQUE7O1lBRUE7O1dBRUEsTUFBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLE1BQUEsSUFBQSxPQUFBOzs7Ozs7SUFNQSxTQUFBLFlBQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTs7OztJQUlBLFNBQUEsWUFBQSxNQUFBO01BQ0EsR0FBQSxPQUFBOztNQUVBOzs7O0lBSUEsU0FBQSxTQUFBO01BQ0EsR0FBQSxPQUFBOztNQUVBOzs7OztHQUtBLFdBQUEsNEdBQUEsU0FBQSxRQUFBLFdBQUEsUUFBQSxZQUFBLGlCQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7SUFDQSxJQUFBLE1BQUEsVUFBQTs7SUFFQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLE9BQUEsU0FBQSxJQUFBLFNBQUE7SUFDQSxHQUFBLFFBQUEsWUFBQSxLQUFBO0lBQ0EsR0FBQSxZQUFBLFlBQUEsS0FBQSxRQUFBLEdBQUE7O0lBRUEsR0FBQSxjQUFBO0lBQ0EsR0FBQSxjQUFBO0lBQ0EsR0FBQSxXQUFBOztJQUVBOztJQUVBLFNBQUEsUUFBQTtNQUNBLElBQUEsU0FBQTtRQUNBLFlBQUEsR0FBQTtRQUNBLE1BQUEsR0FBQTtRQUNBLFdBQUE7OztNQUdBLFVBQUEsT0FBQTs7TUFFQTtTQUNBLE1BQUE7U0FDQTtTQUNBLEtBQUEsU0FBQSxJQUFBO1VBQ0EsR0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBO1lBQ0EsS0FBQSxxQkFBQSxZQUFBLEtBQUEsaUJBQUEsS0FBQTtZQUNBLEtBQUEsY0FBQSxZQUFBLEtBQUEsZ0JBQUEsS0FBQTs7O1VBR0EsR0FBQSxRQUFBLEdBQUE7VUFDQSxHQUFBLGNBQUEsR0FBQTs7VUFFQSxJQUFBLE1BQUEsR0FBQSxjQUFBLEdBQUE7VUFDQSxHQUFBLGFBQUEsR0FBQSxjQUFBLEdBQUEsU0FBQSxJQUFBLE9BQUEsS0FBQSxNQUFBLE9BQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLE1BQUEsSUFBQSxLQUFBLE9BQUE7Ozs7O0lBS0EsU0FBQSxTQUFBLE1BQUE7TUFDQSxJQUFBLFFBQUEsZUFBQTtRQUNBO1dBQ0EsT0FBQTtZQUNBLElBQUEsS0FBQTs7V0FFQTtXQUNBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7WUFFQTs7V0FFQSxNQUFBLFNBQUEsS0FBQTtZQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7OztJQU1BLFNBQUEsWUFBQSxNQUFBO01BQ0EsR0FBQSxPQUFBO01BQ0EsR0FBQSxPQUFBOztNQUVBOzs7O0lBSUEsU0FBQSxZQUFBLE1BQUE7TUFDQSxHQUFBLE9BQUE7O01BRUE7Ozs7OztHQU1BLFdBQUEsdUdBQUEsU0FBQSxRQUFBLGdCQUFBLFFBQUEsaUJBQUEsWUFBQSxhQUFBO0lBQ0EsSUFBQSxLQUFBOztJQUVBLFFBQUEsT0FBQSxJQUFBOztJQUVBLEdBQUEsT0FBQTtJQUNBLEdBQUEsUUFBQTs7SUFFQSxHQUFBLFNBQUE7SUFDQSxHQUFBLFdBQUE7O0lBRUEsTUFBQTs7SUFFQSxTQUFBLE1BQUEsTUFBQTtNQUNBLEdBQUEsT0FBQTs7TUFFQTtTQUNBLE1BQUE7VUFDQSxTQUFBO1VBQ0Esa0JBQUEsWUFBQTtVQUNBLE1BQUE7VUFDQSxZQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxHQUFBLFFBQUEsSUFBQTtVQUNBLEdBQUEsY0FBQSxJQUFBOztTQUVBLE1BQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7OztJQUlBLFNBQUEsU0FBQSxRQUFBO01BQ0EsR0FBQSxrQkFBQTs7TUFFQTtTQUNBLE9BQUE7VUFDQSxJQUFBLFlBQUE7V0FDQTtVQUNBLGNBQUEsT0FBQTs7U0FFQTtTQUNBLEtBQUEsU0FBQSxLQUFBO1VBQ0EsT0FBQSxRQUFBLElBQUEsT0FBQTs7VUFFQSxlQUFBLE1BQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxHQUFBLGtCQUFBO1VBQ0EsT0FBQSxNQUFBLElBQUEsT0FBQTs7OztJQUlBLFNBQUEsU0FBQTtNQUNBLGVBQUE7Ozs7O0dBS0EsV0FBQSxzRkFBQSxTQUFBLFFBQUEsZ0JBQUEsUUFBQSxXQUFBLGFBQUE7SUFDQSxJQUFBLEtBQUE7O0lBRUEsUUFBQSxPQUFBLElBQUE7O0lBRUEsR0FBQSxlQUFBO0lBQ0EsR0FBQSxTQUFBOztJQUVBLFNBQUEsZUFBQTtNQUNBLEdBQUEsc0JBQUE7O01BRUE7U0FDQSxPQUFBO1VBQ0EsSUFBQSxZQUFBO1VBQ0EsTUFBQSxHQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLGVBQUE7O1NBRUEsTUFBQSxTQUFBLEtBQUE7VUFDQSxHQUFBLHNCQUFBOztVQUVBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7SUFJQSxTQUFBLFNBQUE7TUFDQSxlQUFBOzs7Ozs7O0FDcldBO0dBQ0EsT0FBQSxxQkFBQTtHQUNBLFVBQUEsZ0NBQUEsU0FBQSxVQUFBO0lBQ0EsT0FBQTtNQUNBLFVBQUE7TUFDQSxNQUFBLFNBQUEsT0FBQSxTQUFBLFlBQUE7UUFDQSxNQUFBLE9BQUEsV0FBQSxvQkFBQSxTQUFBLE9BQUE7VUFDQSxRQUFBLEtBQUEsaUJBQUEsQ0FBQSxDQUFBOzs7Ozs7QUNUQTtHQUNBLE9BQUEsZ0JBQUE7O0dBRUEsT0FBQSxVQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsR0FBQTtNQUNBLElBQUEsS0FBQSxNQUFBO1FBQ0EsT0FBQTs7O01BR0EsSUFBQSxFQUFBLFFBQUEsWUFBQTs7TUFFQSxJQUFBLEVBQUEsU0FBQSxHQUFBO1FBQ0EsT0FBQTs7O01BR0EsSUFBQSxLQUFBLEVBQUEsTUFBQTs7TUFFQSxHQUFBLE9BQUEsR0FBQSxHQUFBOztNQUVBLElBQUEsRUFBQSxVQUFBLEdBQUE7UUFDQSxHQUFBLE9BQUEsR0FBQSxHQUFBOzs7TUFHQSxPQUFBLEdBQUEsS0FBQTs7OztBQ3ZCQTtHQUNBLE9BQUEsYUFBQTtHQUNBLFFBQUEsWUFBQSxZQUFBO0lBQ0EsSUFBQSxXQUFBLFVBQUEsTUFBQSxHQUFBO01BQ0EsT0FBQSxLQUFBLGdCQUFBLEtBQUEsS0FBQSxhQUFBLEtBQUEsSUFBQSxLQUFBOzs7SUFHQSxPQUFBO01BQ0EsbUJBQUEsVUFBQSxNQUFBO1FBQ0EsT0FBQSxTQUFBLE1BQUE7OztNQUdBLG1CQUFBLFNBQUEsTUFBQTtRQUNBLElBQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxJQUFBLEtBQUE7O1FBRUEsSUFBQSxJQUFBLElBQUE7VUFDQSxJQUFBLE1BQUE7OztRQUdBLElBQUEsSUFBQSxJQUFBO1VBQ0EsSUFBQSxNQUFBOzs7UUFHQSxPQUFBLENBQUEsU0FBQSxNQUFBLE1BQUEsSUFBQSxNQUFBLEdBQUEsS0FBQTs7Ozs7QUN2QkE7R0FDQSxPQUFBLGNBQUE7R0FDQSxRQUFBLFNBQUEsWUFBQTtJQUNBLE9BQUEsVUFBQSxPQUFBO01BQ0EsT0FBQTtRQUNBLEtBQUEsVUFBQSxNQUFBLE1BQUE7VUFDQSxPQUFBLE1BQUEsTUFBQSxLQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBO2FBQ0E7O1FBRUEsTUFBQSxVQUFBLE1BQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxNQUFBLEtBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLFVBQUE7YUFDQTs7UUFFQSxNQUFBLFVBQUEsTUFBQSxLQUFBO1VBQ0EsT0FBQSxNQUFBLE1BQUEsS0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsVUFBQTs7O1FBR0EsTUFBQSxVQUFBLE1BQUE7VUFDQSxPQUFBLE1BQUE7O1FBRUEsT0FBQSxVQUFBLE1BQUEsTUFBQTtVQUNBLE9BQUEsTUFBQSxNQUFBLE9BQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLFFBQUEsS0FBQSxXQUFBLENBQUE7Ozs7OztBQzFCQTtHQUNBLE9BQUEsb0JBQUEsQ0FBQSxzQkFBQTs7R0FFQSx5QkFBQSxTQUFBLGVBQUE7SUFDQSxjQUFBLGFBQUEsS0FBQTs7O0lBR0EsY0FBQSxTQUFBLFFBQUEsT0FBQSxzQkFBQTs7O0dBR0EsUUFBQSw4REFBQSxTQUFBLElBQUEsWUFBQSxXQUFBLE9BQUE7SUFDQSxPQUFBOztNQUVBLFdBQUEsU0FBQSxRQUFBO1FBQ0EsUUFBQSxPQUFBLE9BQUEsU0FBQSxNQUFBOzs7UUFHQSxJQUFBLE9BQUEsSUFBQSxRQUFBLFlBQUEsQ0FBQSxLQUFBLE9BQUEsSUFBQSxRQUFBLFdBQUEsQ0FBQSxHQUFBO1VBQ0EsT0FBQTs7O1FBR0EsT0FBQSxNQUFBLE9BQUEsTUFBQSxRQUFBLElBQUEsT0FBQTs7UUFFQSxPQUFBOzs7O01BSUEsZ0JBQUEsU0FBQSxXQUFBO1FBQ0EsT0FBQSxHQUFBLE9BQUE7Ozs7Ozs7OztNQVNBLFlBQUEsU0FBQSxVQUFBOztRQUVBLElBQUEsTUFBQTtRQUNBLElBQUEsZUFBQSxVQUFBOztRQUVBLElBQUEsUUFBQSxTQUFBLFNBQUEsT0FBQTs7VUFFQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE1BQUE7WUFDQSxPQUFBOzs7VUFHQSxPQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsU0FBQSxLQUFBOzs7OztVQUtBLElBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUE7Y0FDQSxNQUFBLEtBQUE7OztZQUdBLE9BQUEsR0FBQSxPQUFBLFNBQUE7Ozs7OztVQU1BLElBQUEsUUFBQSxNQUFBO1lBQ0EsU0FBQSxPQUFBOzs7Ozs7Ozs7UUFTQSxPQUFBOzs7O01BSUEsaUJBQUEsU0FBQSxXQUFBO1FBQ0EsSUFBQSxlQUFBLFVBQUE7O1FBRUEsSUFBQSxVQUFBLFdBQUEsS0FBQTtVQUNBLE1BQUEsS0FBQTs7O1FBR0EsT0FBQSxHQUFBLE9BQUE7Ozs7O0FDckZBO0dBQ0EsT0FBQSxjQUFBLENBQUE7R0FDQSxRQUFBLHNEQUFBLFNBQUEsTUFBQSxXQUFBLHFCQUFBO0lBQ0EsSUFBQSxrQkFBQTs7SUFFQSxJQUFBLGFBQUE7TUFDQSxXQUFBO01BQ0EsZUFBQTtNQUNBLFlBQUE7OztJQUdBLElBQUEsUUFBQTtNQUNBLE1BQUEsV0FBQTtRQUNBLE9BQUE7OztNQUdBLE1BQUEsU0FBQSxVQUFBO1FBQ0EsVUFBQSxJQUFBO1FBQ0EsVUFBQSxPQUFBLFlBQUE7OztNQUdBLFNBQUEsV0FBQTtRQUNBLElBQUEsU0FBQSxLQUFBO1FBQ0EsSUFBQSxVQUFBOztRQUVBLElBQUEsUUFBQTtVQUNBLFFBQUEsZ0JBQUEsT0FBQSxhQUFBLE1BQUEsT0FBQTs7O1FBR0EsT0FBQTs7O01BR0EsT0FBQSxTQUFBLFFBQUE7UUFDQSxJQUFBLFFBQUE7VUFDQSxvQkFBQSxJQUFBLGlCQUFBOztVQUVBLE9BQUE7OztRQUdBLE9BQUEsb0JBQUEsSUFBQTs7OztJQUlBLE9BQUE7O0FDNUNBO0FBQ0EsUUFBQSxPQUFBLFlBQUEsSUFBQSxDQUFBLFlBQUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxrQkFBQTtJQUNBLE1BQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtJQUNBLEtBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQTs7RUFFQSxTQUFBLE1BQUEsV0FBQTtJQUNBLG9CQUFBO01BQ0EsU0FBQTtRQUNBO1FBQ0E7O01BRUEsT0FBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztNQUVBLFNBQUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsWUFBQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztNQUVBLGNBQUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O01BRUEsWUFBQTtNQUNBLFlBQUE7TUFDQSxVQUFBO01BQ0EsY0FBQTtNQUNBLGNBQUE7TUFDQSxTQUFBO01BQ0EsYUFBQTtNQUNBLGFBQUE7O0lBRUEsa0JBQUE7TUFDQSxnQkFBQTtNQUNBLGVBQUE7TUFDQSxhQUFBO01BQ0EsWUFBQSxDQUFBO1FBQ0EsU0FBQTtRQUNBLFVBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFdBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtTQUNBO1FBQ0EsU0FBQTtRQUNBLFVBQUE7UUFDQSxXQUFBO1FBQ0EsV0FBQTtRQUNBLFdBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTtRQUNBLFVBQUE7UUFDQSxVQUFBO1FBQ0EsVUFBQTs7O0lBR0EsTUFBQTtJQUNBLGFBQUEsU0FBQSxHQUFBO01BQ0EsT0FBQSxnQkFBQTs7Ozs7QUNyR0E7R0FDQSxPQUFBOztHQUVBLFdBQUEsc0ZBQUEsVUFBQSxRQUFBLElBQUEsV0FBQSxVQUFBLFFBQUEsVUFBQSxPQUFBO0lBQ0EsSUFBQSxLQUFBOztJQUVBLEdBQUEsUUFBQTs7SUFFQSxTQUFBLFFBQUE7TUFDQSxPQUFBO1NBQ0EsS0FBQSxRQUFBLE9BQUEsTUFBQSxRQUFBO1VBQ0EsVUFBQSxHQUFBO1VBQ0EsVUFBQSxHQUFBOztTQUVBO1NBQ0EsS0FBQSxTQUFBLEtBQUE7VUFDQSxNQUFBLE1BQUEsSUFBQTs7VUFFQSxPQUFBLFFBQUEsSUFBQSxPQUFBOztVQUVBLElBQUEsS0FBQSxVQUFBO1VBQ0EsVUFBQSxJQUFBLEdBQUEsWUFBQTs7U0FFQSxNQUFBLFNBQUEsS0FBQTtVQUNBLE9BQUEsTUFBQSxJQUFBLE9BQUE7Ozs7QUN4QkE7R0FDQSxPQUFBLG1CQUFBLENBQUE7R0FDQSxRQUFBLDBCQUFBLFVBQUEsV0FBQTtJQUNBLE9BQUEsVUFBQSxZQUFBLFdBQUEsaUJBQUEsTUFBQTtNQUNBLE1BQUE7UUFDQSxRQUFBOztRQUVBLFNBQUE7VUFDQSxnQkFBQTs7O1FBR0Esa0JBQUEsU0FBQSxNQUFBO1VBQ0EsSUFBQSxNQUFBOztVQUVBLFFBQUEsUUFBQSxNQUFBLFNBQUEsT0FBQSxLQUFBO1lBQ0EsS0FBQSxLQUFBLG1CQUFBLE9BQUEsTUFBQSxtQkFBQTthQUNBOztVQUVBLE9BQUEsSUFBQSxLQUFBOzs7O0tBSUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5bqU55So5YWl5Y+jXG4vLyBNb2R1bGU6IGd1bHVcbi8vIERlcGVuZGVuY2llczpcbi8vICAgIG5nUm91dGUsIGh0dHBJbnRlcmNlcHRvcnMsIGd1bHUubWlzc2luZ1xuXG4vKiBnbG9iYWwgZmFsbGJhY2tIYXNoICovXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ25nTG9jYWxlJyxcbiAgICAndG9hc3RyJyxcbiAgICAnTG9jYWxTdG9yYWdlTW9kdWxlJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAnY3VzdG9tLmRpcmVjdGl2ZXMnLFxuICAgICdodHRwSW50ZXJjZXB0b3JzJyxcbiAgICAnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICd1dGlsLmZpbHRlcnMnLFxuICAgICd1dGlsLmRhdGUnLFxuICAgICdndWx1LmxvZ2luJyxcbiAgICAnZ3VsdS5jbGllbnRfc2VydmljZScsXG4gICAgJ2d1bHUubWlzc2luZydcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkc3RhdGVQcm92aWRlciwgbG9jYWxTdG9yYWdlU2VydmljZVByb3ZpZGVyKSB7XG4gICAgLy8gbm90IHVzZSBodG1sNSBoaXN0b3J5IGFwaVxuICAgIC8vIGJ1dCB1c2UgaGFzaGJhbmdcbiAgICAkbG9jYXRpb25Qcm92aWRlclxuICAgICAgLmh0bWw1TW9kZShmYWxzZSlcbiAgICAgIC5oYXNoUHJlZml4KCchJyk7XG5cbiAgICAvLyBkZWZpbmUgNDA0XG4gICAgJHVybFJvdXRlclByb3ZpZGVyXG4gICAgICAub3RoZXJ3aXNlKCcvbG9naW4nKTtcblxuICAgIC8vIGxvY2FsU3RvcmFnZSBwcmVmaXhcbiAgICBsb2NhbFN0b3JhZ2VTZXJ2aWNlUHJvdmlkZXJcbiAgICAgIC5zZXRQcmVmaXgoJ2d1bHUua2YnKVxuICAgICAgLnNldE5vdGlmeSh0cnVlLCB0cnVlKTtcblxuICAgIC8vIEFQSSBTZXJ2ZXJcbiAgICBBUElfU0VSVkVSUyA9IHtcbiAgICAgIGNzZXJ2aWNlOiAnaHR0cDovL2NzLmd1bHVhYmMuY29tJ1xuICAgICAgLy8gY3NlcnZpY2U6ICdodHRwOi8vby5kcDozMDAwJ1xuICAgIH07XG5cbiAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLm9uKCdkZXZpY2VyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5vbignYmFja2J1dHRvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KVxuICAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRsb2NhdGlvbiwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcbiAgICB2YXIgcmVnID0gL1tcXCZcXD9dXz1cXGQrLztcblxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xuICAgICRyb290U2NvcGUuJHN0YXRlUGFyYW1zID0gJHN0YXRlUGFyYW1zO1xuXG4gICAgLy8g55So5LqO6L+U5Zue5LiK5bGC6aG16Z2iXG4gICAgJHJvb3RTY29wZVxuICAgICAgLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICRsb2NhdGlvbi51cmwoKTtcbiAgICAgIH0sIGZ1bmN0aW9uKGN1cnJlbnQsIG9sZCkge1xuICAgICAgICBpZiAoY3VycmVudC5yZXBsYWNlKHJlZywgJycpID09PSBvbGQucmVwbGFjZShyZWcsICcnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgICRyb290U2NvcGUuYmFja1VybCA9IG9sZDtcbiAgICAgIH0pO1xuXG4gICAgJHJvb3RTY29wZS5iYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbG9jYXRpb24udXJsKCRyb290U2NvcGUuYmFja1VybCk7XG4gICAgfVxuICB9KTtcblxuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmNsaWVudF9zZXJ2aWNlJywgW1xuICAgICd1aS5yb3V0ZXInLFxuICAgICdndWx1LmluZGVudCdcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2NsaWVudF9zZXJ2aWNlJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL2luZGVudHMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2NsaWVudC1zZXJ2aWNlL2Rhc2hib2FyZC5odG0nLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgSW5kZW50RW51bXM6ICdJbmRlbnRFbnVtcydcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnY2xpZW50X3NlcnZpY2UubGlzdCcsIHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvbGlzdC5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnSW5kZW50TGlzdEN0cmwnXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdjbGllbnRfc2VydmljZS5hcHByb3ZhbCcsIHtcbiAgICAgICAgdXJsOiAnL2FwcHJvdmFsJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvbGlzdF9hcHByb3ZhbC5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnSW5kZW50QXBwcm92YWxMaXN0Q3RybCdcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2NsaWVudF9zZXJ2aWNlLmluZGVudCcsIHtcbiAgICAgICAgdXJsOiAnL3tpbmRlbnRfaWQ6WzAtOV0rfScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaW5kZW50L2VkaXQuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0luZGVudEN0cmwnXG4gICAgICB9KTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuaW5kZW50JywgW1xuICAgICdndWx1LmluZGVudC5zdmNzJyxcbiAgICAnZ3VsdS5pbmRlbnQuZW51bXMnXG4gIF0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmxvZ2luJywgW1xuICAgICd1aS5yb3V0ZXInLFxuICAgICd1dGlsLm9hdXRoJyxcbiAgICAnZ3VsdS5sb2dpbi5zdmNzJ1xuICBdKVxuXG4gIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlclxuICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdsb2dpbi9sb2dpbi5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgICAgfSk7XG4gIH0pO1xuIiwiLy8gNDA0IOmhtemdolxuLy8gTW9kdWxlOiBndWx1Lm1pc3Npbmdcbi8vIERlcGVuZGVuY2llczogbmdSb3V0ZVxuXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUubWlzc2luZycsIFsndWkucm91dGVyJ10pXG5cbiAgLy8g6YWN572uIHJvdXRlXG4gIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgnbWlzc2luZycsIHtcbiAgICAgICAgdXJsOiAnL21pc3NpbmcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJzQwNC80MDQuaHRtJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01pc3NpbmdDdHJsJ1xuICAgICAgfSk7XG4gIH0pXG5cbiAgLy8gNDA0IGNvbnRyb2xsZXJcbiAgLmNvbnRyb2xsZXIoJ01pc3NpbmdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgIGNvbnNvbGUubG9nKCdJYG0gaGVyZScpO1xuICAgIC8vIFRPRE86XG4gICAgLy8gMS4gc2hvdyBsYXN0IHBhdGggYW5kIHBhZ2UgbmFtZVxuICB9KTtcbiIsImFuZ3VsYXJcbiAgLm1vZHVsZSgnZ3VsdS5pbmRlbnQnKVxuICBcbiAgLmNvbnRyb2xsZXIoJ0luZGVudEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRsb2NhdGlvbiwgJHRpbWVvdXQsXG4gICAgJGZpbHRlciwgdG9hc3RyLCBEYXRlVXRpbCwgSW5kZW50c1N2YywgSW5kZW50Q3JlYXRlU3ZjLCBJbmRlbnRVbnJlYWNoU3ZjLCBJbmRlbnRTdmMsXG4gICAgSW5kZW50VmFsaWRhdGVTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuXG4gICAgdmFyIGluZGVudF9pZCA9IHZtLiRzdGF0ZVBhcmFtcy5pbmRlbnRfaWQ7XG5cbiAgICB2bS50eXBlX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdvcmRlcl90eXBlJyk7XG4gICAgLy8gdm0uY2hhbm5lbF9saXN0ID0gSW5kZW50RW51bXMubGlzdCgnY2hhbm5lbCcpO1xuICAgIC8vIHZtLmJyYW5kX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdicmFuZCcpO1xuICAgIC8vIHZtLnNlcmllc19saXN0ID0gSW5kZW50RW51bXMubGlzdCgnc2VyaWVzJyk7XG5cbiAgICB2bS5zdWJtaXQgPSBzdWJtaXQ7XG4gICAgdm0uY2FuY2VsID0gY2FuY2VsO1xuICAgIHZtLmNhbmNlbF9jb25maXJtID0gY2FuY2VsX2NvbmZpcm07XG4gICAgdm0ub3Blbl9kYXRlcGlja2VyID0gb3Blbl9kYXRlcGlja2VyO1xuXG4gICAgZnVuY3Rpb24gc3VibWl0KCkge1xuICAgICAgcmV0dXJuIEluZGVudFZhbGlkYXRlU3ZjXG4gICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgIGlkOiB2bS5pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZV9pZDogdm0ub3JkZXJfdHlwZS52YWx1ZSxcbiAgICAgICAgICBjb250YWN0OiB7XG4gICAgICAgICAgICBuYW1lOiB2bS5jb250YWN0X25hbWUsXG4gICAgICAgICAgICBtb2JpbGU6IHZtLmNvbnRhY3RfbW9iaWxlLnJlcGxhY2UoL1tcXHNcXC1dKy9nLCAnJylcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFwcG9pbnRtZW50X3RpbWU6IHZtLmFwcG9pbnRtZW50X3RpbWUsXG4gICAgICAgICAgYWRkcmVzczogdm0uYWRkcmVzcyxcbiAgICAgICAgICBtZW1vOiB2bS5tZW1vXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhyZXMubXNnIHx8ICfpooTnuqbljZXnoa7orqTlubbnlJ/mlYjmiJDlip8nKTtcblxuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5iYWNrKCk7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn6aKE57qm5Y2V56Gu6K6k5bm255Sf5pWI5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5fZGF0ZXBpY2tlcigkZXZlbnQpIHtcbiAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICB2bS5hcHBvaW50bWVudF90aW1lX29wZW4gPSB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgIEluZGVudFN2Y1xuICAgICAgICAucmVtb3ZlKHtcbiAgICAgICAgICBpZDogdm0uaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIG1lbW86IHZtLm1lbW9cbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKHJlcy5tc2cgfHwgJ+WPlua2iOmihOe6puWNleaIkOWKnycpO1xuXG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmJhY2soKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICflj5bmtojpooTnuqbljZXlpLHotKXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuY2VsX2NvbmZpcm0oKSB7XG4gICAgICBJbmRlbnRVbnJlYWNoU3ZjXG4gICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgIGlkOiB2bS5pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgbWVtbzogdm0ubWVtb1xuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5bey5Y+W5raI56Gu6K6k6K6i5Y2VJyk7XG5cbiAgICAgICAgICAkcm9vdFNjb3BlLmJhY2soKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICflj5bmtojnoa7orqTorqLljZXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0X2l0ZW0obGlzdF9uYW1lLCB2YWx1ZSkge1xuICAgICAgdm1bbGlzdF9uYW1lXSA9IEluZGVudEVudW1zLml0ZW0obGlzdF9uYW1lLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2F0Y2hfYXBwb2ludG1lbnRfdGltZV9wYXJ0KCkge1xuICAgICAgdm0uJHdhdGNoKCdhcHBvaW50bWVudF90aW1lX2JlZm9yZScsIGZ1bmN0aW9uKGFwcG9pbnRtZW50X3RpbWVfYmVmb3JlKSB7XG4gICAgICAgIGlmIChhcHBvaW50bWVudF90aW1lX2JlZm9yZSAmJiAhdm0uZWRpdF9mb3JtLmFwcG9pbnRtZW50X3RpbWVfYmVmb3JlLiRwcmlzdGluZSkge1xuICAgICAgICAgIHZtLmFwcG9pbnRtZW50X3RpbWVfYWZ0ZXIgPSBuZXcgRGF0ZShhcHBvaW50bWVudF90aW1lX2JlZm9yZSk7ICBcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZtLiR3YXRjaCgnYXBwb2ludG1lbnRfdGltZV9hZnRlcicsIGZ1bmN0aW9uKGFwcG9pbnRtZW50X3RpbWVfYWZ0ZXIpIHtcbiAgICAgICAgaWYgKGFwcG9pbnRtZW50X3RpbWVfYWZ0ZXIgJiYgIXZtLmVkaXRfZm9ybS5hcHBvaW50bWVudF90aW1lX2FmdGVyLiRwcmlzdGluZSkge1xuICAgICAgICAgIHZtLmFwcG9pbnRtZW50X3RpbWUgPSBEYXRlVXRpbC50b0xvY2FsVGltZVN0cmluZyhhcHBvaW50bWVudF90aW1lX2FmdGVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0X3NlbGVjdGVkX2l0ZW0oKSB7XG4gICAgICBzZWxlY3RfaXRlbSgnb3JkZXJfdHlwZScsIHZtLnR5cGVfaWQpO1xuICAgICAgLy8gc2VsZWN0X2l0ZW0oJ2NoYW5uZWwnLCB2bS5jaGFubmVsKTtcbiAgICAgIC8vIHNlbGVjdF9pdGVtKCdicmFuZCcsIHZtLmNhci5icmFuZCk7XG4gICAgICAvLyBzZWxlY3RfaXRlbSgnc2VyaWVzJywgdm0uY2FyLnNlcmllcyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhhbmRsZXIocmVzKSB7XG4gICAgICBhbmd1bGFyLmV4dGVuZCh2bSwgcmVzLnRvSlNPTigpKTtcblxuICAgICAgaWYgKHZtLmFwcG9pbnRtZW50X3RpbWUpIHtcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50X3RpbWVfc3AgPSB2bS5hcHBvaW50bWVudF90aW1lLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgdm0uYXBwb2ludG1lbnRfdGltZV9iZWZvcmUgPSBhcHBvaW50bWVudF90aW1lX3NwWzBdO1xuICAgICAgICB2bS5hcHBvaW50bWVudF90aW1lX2FmdGVyID0gbmV3IERhdGUodm0uYXBwb2ludG1lbnRfdGltZSk7XG4gICAgICB9XG5cbiAgICAgIHZtLmNvbnRhY3RfbmFtZSA9IHZtLmNvbnRhY3QubmFtZTtcbiAgICAgIHZtLmNvbnRhY3RfbW9iaWxlID0gdm0uY29udGFjdC5tb2JpbGU7XG5cbiAgICAgIHNldF9zZWxlY3RlZF9pdGVtKCk7XG4gICAgICB3YXRjaF9hcHBvaW50bWVudF90aW1lX3BhcnQoKTtcbiAgICB9XG5cbiAgICAvLyDmlrDlu7rpooTnuqbljZVcbiAgICBpZiAoaW5kZW50X2lkID09IDApIHtcbiAgICAgIHJldHVybiBJbmRlbnRDcmVhdGVTdmNcbiAgICAgICAgLnNhdmUoe1xuICAgICAgICAgIC8vIOadpea6kO+8mueUteivnVxuICAgICAgICAgIG9yZGVyX3Rocm91Z2g6IDJcbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGhhbmRsZXIpXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5paw5bu66aKE57qm5Y2V5aSx6LSl77yM6K+35Yi35paw6YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOiLpeabtOaWsOmihOe6puWNle+8jOWImeiOt+WPlumihOe6puWNleS/oeaBr1xuICAgIEluZGVudFN2Y1xuICAgICAgLmdldCh7XG4gICAgICAgIGlkOiBpbmRlbnRfaWRcbiAgICAgIH0pXG4gICAgICAuJHByb21pc2VcbiAgICAgIC50aGVuKGhhbmRsZXIpXG4gICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfojrflj5borqLljZXkv6Hmga/lpLHotKXvvIzor7fliLfmlrDph43or5UnKTtcbiAgICAgIH0pO1xuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUuaW5kZW50LmVudW1zJywgWyd1dGlsLmVudW1zJywgJ2d1bHUuaW5kZW50LnN2Y3MnXSlcblxuICAuZmFjdG9yeSgnSW5kZW50RW51bXMnLCBmdW5jdGlvbihFbnVtcywgSW5kZW50RW51bXNTdmMsIHRvYXN0cikge1xuICAgIHJldHVybiBJbmRlbnRFbnVtc1N2Y1xuICAgICAgLmdldCgpXG4gICAgICAuJHByb21pc2VcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICB2YXIgYWxsX3ByZWlucyA9ICdvcmRlcl90eXBlIG9yZGVyX3N0YXR1cyBjaXR5IGluc3BlY3RvciB1c2VyX3R5cGUgb3JkZXJfdGhyb3VnaCcuc3BsaXQoJyAnKTtcblxuICAgICAgICBhbGxfcHJlaW5zLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgcmVzW2tleV0udW5zaGlmdCh7XG4gICAgICAgICAgICB0ZXh0OiAn5YWo6YOoJyxcbiAgICAgICAgICAgIHZhbHVlOiBudWxsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc1snc2l6ZSddID0gW3tcbiAgICAgICAgICB0ZXh0OiAxMCxcbiAgICAgICAgICB2YWx1ZTogMTBcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRleHQ6IDE1LFxuICAgICAgICAgIHZhbHVlOiAxNVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdGV4dDogMjAsXG4gICAgICAgICAgdmFsdWU6IDIwXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0ZXh0OiA1MCxcbiAgICAgICAgICB2YWx1ZTogNTBcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRleHQ6IDEwMCxcbiAgICAgICAgICB2YWx1ZTogMTAwXG4gICAgICAgIH1dO1xuXG4gICAgICAgIHJldHVybiBFbnVtcyhyZXMudG9KU09OKCkpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+iOt+WPluaemuS4vuWksei0pScpO1xuICAgICAgfSk7XG4gIH0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudC5zdmNzJywgWyduZ1Jlc291cmNlJ10pXG5cbiAgLnNlcnZpY2UoJ0luZGVudEVudW1zU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvcGFyYW1ldGVycycpO1xuICB9KVxuICBcbiAgLnNlcnZpY2UoJ0luZGVudHNTdmMnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLmNzZXJ2aWNlICsgJy9vcmRlcnMnLCB7fSwge1xuICAgICAgcXVlcnk6IHtcbiAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50Q3JlYXRlU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXInKTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50U3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50QXNzZXJ0U3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkL2Fzc2VydGVkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VmFsaWRhdGVTdmMnLCBmdW5jdGlvbigkcmVzb3VyY2UpIHtcbiAgICByZXR1cm4gJHJlc291cmNlKEFQSV9TRVJWRVJTLmNzZXJ2aWNlICsgJy9vcmRlci86aWQvdmFsaWRhdGVkJywge1xuICAgICAgaWQ6ICdAaWQnXG4gICAgfSwge1xuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BVVCdcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VW5yZWFjaFN2YycsIGZ1bmN0aW9uKCRyZXNvdXJjZSkge1xuICAgIHJldHVybiAkcmVzb3VyY2UoQVBJX1NFUlZFUlMuY3NlcnZpY2UgKyAnL29yZGVyLzppZC91bnJlYWNoYWJsZScsIHtcbiAgICAgIGlkOiAnQGlkJ1xuICAgIH0sIHtcbiAgICAgIHVwZGF0ZToge1xuICAgICAgICBtZXRob2Q6ICdQVVQnXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50VGVzdGVyU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkL2Fzc2lnbmVkJywge1xuICAgICAgaW5zcGVjdG9yX2lkOiAnQGluc3BlY3Rvcl9pZCdcbiAgICB9LCB7XG4gICAgICB1cGRhdGU6IHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgfVxuICAgIH0pO1xuICB9KVxuXG4gIC5zZXJ2aWNlKCdUZXN0ZXJzU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvYWNjb3VudC9pbnNwZWN0b3JzL2lkbGUnLCB7fSwge1xuICAgICAgcXVlcnk6IHtcbiAgICAgICAgaXNBcnJheTogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc2VydmljZSgnSW5kZW50UmV2b2tlU3ZjJywgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb3JkZXIvOmlkL3Jldm9rZWQnLCB7XG4gICAgICBpZDogJ0BpZCdcbiAgICB9LCB7XG4gICAgICB1cGRhdGU6IHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJ1xuICAgICAgfVxuICAgIH0pO1xuICB9KTsiLCIvKiBnbG9iYWwgYW5ndWxhciAqL1xuYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmluZGVudCcpXG4gIFxuICAuY29udHJvbGxlcignSW5kZW50TGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRsb2NhdGlvbiwgJHEsIHRvYXN0ciwgJG1vZGFsLFxuICAgIEluZGVudHNTdmMsIEluZGVudFJldm9rZVN2YywgSW5kZW50QXNzZXJ0U3ZjLCBJbmRlbnRTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuICAgIHZhciBxc28gPSAkbG9jYXRpb24uc2VhcmNoKCk7XG5cbiAgICB2bS5zdGF0dXNfaWQgPSBwYXJzZUludChxc28uc3RhdHVzX2lkKSB8fCBudWxsO1xuICAgIHZtLmNpdHlfaWQgPSBwYXJzZUludChxc28uY2l0eV9pZCkgfHwgbnVsbDtcbiAgICB2bS5pbnNwZWN0b3JfaWQgPSBwYXJzZUludChxc28uaW5zcGVjdG9yX2lkKSB8fCBudWxsO1xuICAgIC8vIHZtLnJvbGVfaWQgPSBwYXJzZUludChxc28ucm9sZV9pZCkgfHwgbnVsbDtcbiAgICB2bS5jb250YWN0X21vYmlsZSA9IHFzby5jb250YWN0X21vYmlsZSB8fCBudWxsO1xuXG4gICAgdm0uc3RhdHVzID0gSW5kZW50RW51bXMuaXRlbSgnb3JkZXJfc3RhdHVzJywgdm0uc3RhdHVzX2lkKTtcbiAgICB2bS5zdGF0dXNfbGlzdCA9IEluZGVudEVudW1zLmxpc3QoJ29yZGVyX3N0YXR1cycpO1xuICAgIHZtLmNpdHkgPSBJbmRlbnRFbnVtcy5pdGVtKCdjaXR5Jywgdm0uY2l0eV9pZCk7XG4gICAgdm0uY2l0eV9saXN0ID0gSW5kZW50RW51bXMubGlzdCgnY2l0eScpO1xuICAgIC8vIHZtLnJvbGUgPSBJbmRlbnRFbnVtcy5pdGVtKCdyb2xlJywgdm0ucm9sZV9pZCk7XG4gICAgLy8gdm0ucm9sZV9saXN0ID0gSW5kZW50RW51bXMubGlzdCgncm9sZScpO1xuICAgIHZtLmluc3BlY3RvciA9IEluZGVudEVudW1zLml0ZW0oJ2luc3BlY3RvcicsIHZtLmluc3BlY3Rvcl9pZCk7XG4gICAgdm0uaW5zcGVjdG9yX2xpc3QgPSBJbmRlbnRFbnVtcy5saXN0KCdpbnNwZWN0b3InKTtcblxuICAgIHZtLnBhZ2UgPSBwYXJzZUludChxc28ucGFnZSkgfHwgMTtcbiAgICB2bS5zaXplID0gcGFyc2VJbnQocXNvLnNpemUpIHx8IDIwO1xuICAgIHZtLnNpemVzID0gSW5kZW50RW51bXMubGlzdCgnc2l6ZScpO1xuICAgIHZtLnNpemVfaXRlbSA9IEluZGVudEVudW1zLml0ZW0oJ3NpemUnLCB2bS5zaXplKTtcblxuICAgIHZtLnNpemVfY2hhbmdlID0gc2l6ZV9jaGFuZ2U7XG4gICAgdm0ucGFnZV9jaGFuZ2UgPSBwYWdlX2NoYW5nZTtcbiAgICB2bS5zZWFyY2ggPSBzZWFyY2g7XG4gICAgdm0uY29uZmlybV9vcmRlciA9IGNvbmZpcm1fb3JkZXI7XG4gICAgdm0uZGlzcGF0Y2hfdGVzdGVyID0gZGlzcGF0Y2hfdGVzdGVyO1xuICAgIHZtLmNhbmNlbF9vcmRlciA9IGNhbmNlbF9vcmRlcjtcbiAgICB2bS5hcHByb3ZhbCA9IGFwcHJvdmFsO1xuXG4gICAgcXVlcnkoKTtcblxuICAgIGZ1bmN0aW9uIHF1ZXJ5KCkge1xuICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgaXRlbXNfcGFnZTogdm0uc2l6ZSxcbiAgICAgICAgcGFnZTogdm0ucGFnZSxcblxuICAgICAgICBzdGF0dXNfaWQ6IHZtLnN0YXR1c19pZCxcbiAgICAgICAgY2l0eV9pZDogdm0uY2l0eV9pZCxcbiAgICAgICAgaW5zcGVjdG9yX2lkOiB2bS5pbnNwZWN0b3JfaWQsXG4gICAgICAgIC8vIHJvbGVfaWQ6IHZtLnJvbGVfaWQsXG4gICAgICAgIGNvbnRhY3RfbW9iaWxlOiB2bS5jb250YWN0X21vYmlsZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJGxvY2F0aW9uLnNlYXJjaChwYXJhbXMpO1xuXG4gICAgICBJbmRlbnRzU3ZjXG4gICAgICAgIC5xdWVyeShwYXJhbXMpXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihycykge1xuICAgICAgICAgIHJzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5vcmRlcl90aHJvdWdoX3RleHQgPSBJbmRlbnRFbnVtcy50ZXh0KCdvcmRlcl90aHJvdWdoJywgaXRlbS5vcmRlcl90aHJvdWdoKTtcbiAgICAgICAgICAgIGl0ZW0uc3RhdHVzX3RleHQgPSBJbmRlbnRFbnVtcy50ZXh0KCdvcmRlcl9zdGF0dXMnLCBpdGVtLnN0YXR1c19pZCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2bS5pdGVtcyA9IHJzLml0ZW1zO1xuICAgICAgICAgIHZtLnRvdGFsX2NvdW50ID0gcnMudG90YWxfY291bnQ7XG5cbiAgICAgICAgICB2YXIgdG1wID0gcnMudG90YWxfY291bnQgLyB2bS5zaXplO1xuICAgICAgICAgIHZtLnBhZ2VfY291bnQgPSBycy50b3RhbF9jb3VudCAlIHZtLnNpemUgPT09IDAgPyB0bXAgOiAoTWF0aC5mbG9vcih0bXApICsgMSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLmRhdGEubXNnIHx8ICfmn6Xor6LlpLHotKXvvIzmnI3liqHlmajlj5HnlJ/mnKrnn6XplJnor6/vvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdm0uJHdhdGNoQ29sbGVjdGlvbignaXRlbXMnLCBmdW5jdGlvbihpdGVtcykge1xuICAgICAgdm0uaXRlbXMgPSBpdGVtcztcbiAgICB9KTtcblxuICAgIHdhdGNoX2xpc3QoJ29yZGVyX3N0YXR1cycsICdzdGF0dXNfaWQnKTtcbiAgICB3YXRjaF9saXN0KCdjaXR5JywgJ2NpdHlfaWQnKTtcbiAgICAvLyB3YXRjaF9saXN0KCdyb2xlJywgJ3JvbGVfaWQnKTtcbiAgICB3YXRjaF9saXN0KCdpbnNwZWN0b3InLCAnaW5zcGVjdG9yX2lkJyk7XG5cbiAgICBmdW5jdGlvbiB3YXRjaF9saXN0KG5hbWUsIGZpZWxkKSB7XG4gICAgICB2bS4kd2F0Y2gobmFtZSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bVtmaWVsZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g56Gu6K6k6K6i5Y2VXG4gICAgZnVuY3Rpb24gY29uZmlybV9vcmRlcihpdGVtKSB7XG4gICAgICBJbmRlbnRBc3NlcnRTdmNcbiAgICAgICAgLnVwZGF0ZSh7XG4gICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgfSlcbiAgICAgICAgLiRwcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKHJlcy5tc2cgfHwgJ+W3suehruiupOivpeiuouWNlScpO1xuXG4gICAgICAgICAgJGxvY2F0aW9uLnVybCgnL2luZGVudHMvJyArIGl0ZW0uaWQpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+ehruiupOivpeiuouWNleWksei0pScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDliIbphY3mo4DmtYvluIhcbiAgICBmdW5jdGlvbiBkaXNwYXRjaF90ZXN0ZXIoaXRlbSkge1xuICAgICAgdmFyIGRpc3BhdGNoX3Rlc3Rlcl9pbnMgPSAkbW9kYWwub3Blbih7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaW5kZW50L2Rpc3BhdGNoX3Rlc3Rlci5odG0nLFxuICAgICAgICBjb250cm9sbGVyOiAnRGlzcGF0Y2hDdHJsJyxcbiAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgaW5kZW50X2luZm86IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZGlzcGF0Y2hfdGVzdGVyX2lucy5yZXN1bHQudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcXVlcnkoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWPlua2iOiuouWNlVxuICAgIGZ1bmN0aW9uIGNhbmNlbF9vcmRlcihpdGVtKSB7XG4gICAgICB2YXIgY2FuY2VsX29yZGVyX2lucyA9ICRtb2RhbC5vcGVuKHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdpbmRlbnQvY2FuY2VsX29yZGVyLmh0bScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDYW5jZWxPcmRlckN0cmwnLFxuICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBpbmRlbnRfaW5mbzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBjYW5jZWxfb3JkZXJfaW5zLnJlc3VsdC50aGVuKGZ1bmN0aW9uKHRlc3Rlcikge1xuICAgICAgICBxdWVyeSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5a6h5qC45Y+W5raIXG4gICAgZnVuY3Rpb24gYXBwcm92YWwoaXRlbSkge1xuICAgICAgaWYgKGNvbmZpcm0oJ+ehruiupOWQjOaEj+WPlua2iOivpeiuouWNle+8nycpKSB7XG4gICAgICAgIEluZGVudFJldm9rZVN2Y1xuICAgICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KVxuICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5ZCM5oSP5Y+W5raI6K+l6K6i5Y2V77yM5pON5L2c5oiQ5YqfJyk7XG5cbiAgICAgICAgICAgIHF1ZXJ5KCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICB0b2FzdHIuZXJyb3IocmVzLm1zZyB8fCAn5o+Q5Lqk5aSx6LSl77yM6K+36YeN6K+VJyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5q+P6aG15p2h5pWw5pS55Y+YXG4gICAgZnVuY3Rpb24gc2l6ZV9jaGFuZ2Uoc2l6ZSkge1xuICAgICAgdm0uc2l6ZSA9IHNpemU7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDnv7vpobVcbiAgICBmdW5jdGlvbiBwYWdlX2NoYW5nZShwYWdlKSB7XG4gICAgICB2bS5wYWdlID0gcGFnZTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG5cbiAgICAvLyDmn6Xor6Lmj5DkuqRcbiAgICBmdW5jdGlvbiBzZWFyY2goKSB7XG4gICAgICB2bS5wYWdlID0gMTtcblxuICAgICAgcXVlcnkoKTtcbiAgICB9XG4gIH0pXG4gIFxuICAvLyDlvoXlrqHmibnliJfooahcbiAgLmNvbnRyb2xsZXIoJ0luZGVudEFwcHJvdmFsTGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRsb2NhdGlvbiwgdG9hc3RyLCBJbmRlbnRzU3ZjLCBJbmRlbnRSZXZva2VTdmMsIEluZGVudEVudW1zKSB7XG4gICAgdmFyIHZtID0gJHNjb3BlO1xuICAgIHZhciBxc28gPSAkbG9jYXRpb24uc2VhcmNoKCk7XG4gICAgXG4gICAgdm0ucGFnZSA9IHBhcnNlSW50KHFzby5wYWdlKSB8fCAxO1xuICAgIHZtLnNpemUgPSBwYXJzZUludChxc28uc2l6ZSkgfHwgMjA7XG4gICAgdm0uc2l6ZXMgPSBJbmRlbnRFbnVtcy5saXN0KCdzaXplJyk7XG4gICAgdm0uc2l6ZV9pdGVtID0gSW5kZW50RW51bXMuaXRlbSgnc2l6ZScsIHZtLnNpemUpO1xuXG4gICAgdm0uc2l6ZV9jaGFuZ2UgPSBzaXplX2NoYW5nZTtcbiAgICB2bS5wYWdlX2NoYW5nZSA9IHBhZ2VfY2hhbmdlO1xuICAgIHZtLmFwcHJvdmFsID0gYXBwcm92YWw7XG5cbiAgICBxdWVyeSgpO1xuXG4gICAgZnVuY3Rpb24gcXVlcnkoKSB7XG4gICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICBpdGVtc19wYWdlOiB2bS5zaXplLFxuICAgICAgICBwYWdlOiB2bS5wYWdlLFxuICAgICAgICBzdGF0dXNfaWQ6IDVcbiAgICAgIH07XG4gICAgICBcbiAgICAgICRsb2NhdGlvbi5zZWFyY2gocGFyYW1zKTtcblxuICAgICAgSW5kZW50c1N2Y1xuICAgICAgICAucXVlcnkocGFyYW1zKVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnMpIHtcbiAgICAgICAgICBycy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0ub3JkZXJfdGhyb3VnaF90ZXh0ID0gSW5kZW50RW51bXMudGV4dCgnb3JkZXJfdGhyb3VnaCcsIGl0ZW0ub3JkZXJfdGhyb3VnaCk7XG4gICAgICAgICAgICBpdGVtLnN0YXR1c190ZXh0ID0gSW5kZW50RW51bXMudGV4dCgnb3JkZXJfc3RhdHVzJywgaXRlbS5zdGF0dXNfaWQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdm0uaXRlbXMgPSBycy5pdGVtcztcbiAgICAgICAgICB2bS50b3RhbF9jb3VudCA9IHJzLnRvdGFsX2NvdW50O1xuXG4gICAgICAgICAgdmFyIHRtcCA9IHJzLnRvdGFsX2NvdW50IC8gdm0uc2l6ZTtcbiAgICAgICAgICB2bS5wYWdlX2NvdW50ID0gcnMudG90YWxfY291bnQgJSB2bS5zaXplID09PSAwID8gdG1wIDogKE1hdGguZmxvb3IodG1wKSArIDEpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5kYXRhLm1zZyB8fCAn5p+l6K+i5aSx6LSl77yM5pyN5Yqh5Zmo5Y+R55Sf5pyq55+l6ZSZ6K+v77yM6K+36YeN6K+VJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWuoeaguOWPlua2iFxuICAgIGZ1bmN0aW9uIGFwcHJvdmFsKGl0ZW0pIHtcbiAgICAgIGlmIChjb25maXJtKCfnoa7orqTlkIzmhI/lj5bmtojor6XorqLljZXvvJ8nKSkge1xuICAgICAgICBJbmRlbnRSZXZva2VTdmNcbiAgICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuJHByb21pc2VcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKHJlcy5tc2cgfHwgJ+WQjOaEj+WPlua2iOivpeiuouWNle+8jOaTjeS9nOaIkOWKnycpO1xuXG4gICAgICAgICAgICBxdWVyeSgpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+aPkOS6pOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIOavj+mhteadoeaVsOaUueWPmFxuICAgIGZ1bmN0aW9uIHNpemVfY2hhbmdlKHNpemUpIHtcbiAgICAgIHZtLnNpemUgPSBzaXplO1xuICAgICAgdm0ucGFnZSA9IDE7XG5cbiAgICAgIHF1ZXJ5KCk7XG4gICAgfVxuXG4gICAgLy8g57+76aG1XG4gICAgZnVuY3Rpb24gcGFnZV9jaGFuZ2UocGFnZSkge1xuICAgICAgdm0ucGFnZSA9IHBhZ2U7XG5cbiAgICAgIHF1ZXJ5KCk7XG4gICAgfVxuXG4gIH0pXG5cbiAgLy8g5YiG6YWN5qOA5rWL5biIXG4gIC5jb250cm9sbGVyKCdEaXNwYXRjaEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRtb2RhbEluc3RhbmNlLCB0b2FzdHIsIEluZGVudFRlc3RlclN2YywgVGVzdGVyc1N2YywgaW5kZW50X2luZm8pIHtcbiAgICB2YXIgdm0gPSAkc2NvcGU7XG5cbiAgICBhbmd1bGFyLmV4dGVuZCh2bSwgaW5kZW50X2luZm8pO1xuXG4gICAgdm0ucGFnZSA9IDE7XG4gICAgdm0ucXVlcnkgPSBxdWVyeTtcblxuICAgIHZtLmNhbmNlbCA9IGNhbmNlbDtcbiAgICB2bS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuXG4gICAgcXVlcnkoMSk7XG5cbiAgICBmdW5jdGlvbiBxdWVyeShwYWdlKSB7XG4gICAgICB2bS5wYWdlID0gcGFnZTtcblxuICAgICAgVGVzdGVyc1N2Y1xuICAgICAgICAucXVlcnkoe1xuICAgICAgICAgIGNpdHlfaWQ6IDAsXG4gICAgICAgICAgYXBwb2ludG1lbnRfdGltZTogaW5kZW50X2luZm8uYXBwb2ludG1lbnRfdGltZSxcbiAgICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICAgIGl0ZW1zX3BhZ2U6IDE1XG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICB2bS5pdGVtcyA9IHJlcy5pdGVtcztcbiAgICAgICAgICB2bS50b3RhbF9jb3VudCA9IHJlcy50b3RhbF9jb3VudDtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfojrflj5bnqbrmoaPmnJ/mo4DmtYvluIjlpLHotKXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGF0Y2godGVzdGVyKSB7XG4gICAgICB2bS5kaXNwYXRjaF9zdGF0dXMgPSB0cnVlO1xuXG4gICAgICBJbmRlbnRUZXN0ZXJTdmNcbiAgICAgICAgLnVwZGF0ZSh7XG4gICAgICAgICAgaWQ6IGluZGVudF9pbmZvLmlkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBpbnNwZWN0b3JfaWQ6IHRlc3Rlci5pZFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn5YiG6YWN5qOA5rWL5biI5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSh0ZXN0ZXIpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdm0uZGlzcGF0Y2hfc3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+WIhumFjeajgOa1i+W4iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gICAgfVxuICB9KVxuICBcbiAgLy8g5Y+W5raI6K6i5Y2VXG4gIC5jb250cm9sbGVyKCdDYW5jZWxPcmRlckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRtb2RhbEluc3RhbmNlLCB0b2FzdHIsIEluZGVudFN2YywgaW5kZW50X2luZm8pIHtcbiAgICB2YXIgdm0gPSAkc2NvcGU7XG5cbiAgICBhbmd1bGFyLmV4dGVuZCh2bSwgaW5kZW50X2luZm8pO1xuXG4gICAgdm0uY2FuY2VsX29yZGVyID0gY2FuY2VsX29yZGVyO1xuICAgIHZtLmNhbmNlbCA9IGNhbmNlbDtcblxuICAgIGZ1bmN0aW9uIGNhbmNlbF9vcmRlcigpIHtcbiAgICAgIHZtLmNhbmNlbF9vcmRlcl9zdGF0dXMgPSB0cnVlO1xuXG4gICAgICBJbmRlbnRTdmNcbiAgICAgICAgLnJlbW92ZSh7XG4gICAgICAgICAgaWQ6IGluZGVudF9pbmZvLmlkLFxuICAgICAgICAgIG1lbW86IHZtLnJlYXNvblxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn6K6i5Y2V5Y+W5raI5oiQ5YqfJyk7XG5cbiAgICAgICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgdm0uY2FuY2VsX29yZGVyX3N0YXR1cyA9IGZhbHNlO1xuXG4gICAgICAgICAgdG9hc3RyLmVycm9yKHJlcy5tc2cgfHwgJ+iuouWNleWPlua2iOWksei0pe+8jOivt+mHjeivlScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gICAgfVxuICB9KTtcblxuIiwiLy8g6Ieq5a6a5LmJIGRpcmVjdGl2ZXNcblxuYW5ndWxhclxuICAubW9kdWxlKCdjdXN0b20uZGlyZWN0aXZlcycsIFtdKVxuICAuZGlyZWN0aXZlKCduZ0luZGV0ZXJtaW5hdGUnLCBmdW5jdGlvbigkY29tcGlsZSkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgc2NvcGUuJHdhdGNoKGF0dHJpYnV0ZXNbJ25nSW5kZXRlcm1pbmF0ZSddLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQucHJvcCgnaW5kZXRlcm1pbmF0ZScsICEhdmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiIsImFuZ3VsYXJcbiAgLm1vZHVsZSgndXRpbC5maWx0ZXJzJywgW10pXG5cbiAgLmZpbHRlcignbW9iaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHMpIHtcbiAgICAgIGlmIChzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICBzID0gcy5yZXBsYWNlKC9bXFxzXFwtXSsvZywgJycpO1xuXG4gICAgICBpZiAocy5sZW5ndGggPCAzKSB7XG4gICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2EgPSBzLnNwbGl0KCcnKTtcblxuICAgICAgc2Euc3BsaWNlKDMsIDAsICctJyk7XG5cbiAgICAgIGlmIChzLmxlbmd0aCA+PSA3KSB7XG4gICAgICAgIHNhLnNwbGljZSg4LCAwLCAnLScpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2Euam9pbignJyk7XG4gICAgfTtcbiAgfSk7XG4iLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ3V0aWwuZGF0ZScsIFtdKVxuICAuZmFjdG9yeSgnRGF0ZVV0aWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRvU3RyaW5nID0gZnVuY3Rpb24gKGRhdGUsIHMpIHtcbiAgICAgIHJldHVybiBkYXRlLmdldEZ1bGxZZWFyKCkgKyBzICsgKGRhdGUuZ2V0TW9udGgoKSArIDEpICsgcyArIGRhdGUuZ2V0RGF0ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b0xvY2FsRGF0ZVN0cmluZzogZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRvU3RyaW5nKGRhdGUsICctJyk7XG4gICAgICB9LFxuXG4gICAgICB0b0xvY2FsVGltZVN0cmluZzogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgdmFyIG0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcblxuICAgICAgICBpZiAoaCA8IDEwKSB7XG4gICAgICAgICAgaCA9ICcwJyArIGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobSA8IDEwKSB7XG4gICAgICAgICAgbSA9ICcwJyArIG07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3RvU3RyaW5nKGRhdGUsICctJyksIGggKyAnOicgKyBtXS5qb2luKCcgJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTsiLCIvLyDmnprkuL4gU2VydmljZVxuYW5ndWxhclxuICAubW9kdWxlKCd1dGlsLmVudW1zJywgW10pXG4gIC5mYWN0b3J5KCdFbnVtcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKEVOVU1TKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWw6IGZ1bmN0aW9uIChuYW1lLCB0ZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnRleHQgPT09IHRleHQ7XG4gICAgICAgICAgfSkudmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHRleHQ6IGZ1bmN0aW9uIChuYW1lLCB2YWwpIHtcbiAgICAgICAgICByZXR1cm4gRU5VTVNbbmFtZV0uZmluZChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsdWUgPT09IHZhbDtcbiAgICAgICAgICB9KS50ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBpdGVtOiBmdW5jdGlvbiAobmFtZSwgdmFsKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdLmZpbmQoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZhbHVlID09PSB2YWw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxpc3Q6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIEVOVU1TW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBpdGVtczogZnVuY3Rpb24gKG5hbWUsIHZhbHMpIHtcbiAgICAgICAgICByZXR1cm4gRU5VTVNbbmFtZV0uZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFscy5pbmRleE9mKGl0ZW0udmFsdWUpICE9PSAtMTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2h0dHBJbnRlcmNlcHRvcnMnLCBbJ0xvY2FsU3RvcmFnZU1vZHVsZScsICd1dGlsLm9hdXRoJ10pXG5cbiAgLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnaHR0cEludGVyY2VwdG9yJyk7XG4gICAgXG4gICAgLy8gQW5ndWxhciAkaHR0cCBpc27igJl0IGFwcGVuZGluZyB0aGUgaGVhZGVyIFgtUmVxdWVzdGVkLVdpdGggPSBYTUxIdHRwUmVxdWVzdCBzaW5jZSBBbmd1bGFyIDEuMy4wXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbltcIlgtUmVxdWVzdGVkLVdpdGhcIl0gPSAnWE1MSHR0cFJlcXVlc3QnO1xuICB9KVxuXG4gIC5mYWN0b3J5KCdodHRwSW50ZXJjZXB0b3InLCBmdW5jdGlvbigkcSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCBPQXV0aCkge1xuICAgIHJldHVybiB7XG4gICAgICAvLyDor7fmsYLliY3kv67mlLkgcmVxdWVzdCDphY3nva5cbiAgICAgICdyZXF1ZXN0JzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZy5oZWFkZXJzLCBPQXV0aC5oZWFkZXJzKCkpO1xuICAgICAgICBcbiAgICAgICAgLy8g6Iul6K+35rGC55qE5piv5qih5p2/77yM5oiW5bey5Yqg5LiK5pe26Ze05oiz55qEIHVybCDlnLDlnYDvvIzliJnkuI3pnIDopoHliqDml7bpl7TmiLNcbiAgICAgICAgaWYgKGNvbmZpZy51cmwuaW5kZXhPZignLmh0bScpICE9PSAtMSB8fCBjb25maWcudXJsLmluZGV4T2YoJz9fPScpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcudXJsID0gY29uZmlnLnVybCArICc/Xz0nICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH0sXG5cbiAgICAgIC8vIOivt+axguWHuumUme+8jOS6pOe7mSBlcnJvciBjYWxsYmFjayDlpITnkIZcbiAgICAgICdyZXF1ZXN0RXJyb3InOiBmdW5jdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZWplY3Rpb24pO1xuICAgICAgfSxcblxuICAgICAgLy8g5ZON5bqU5pWw5o2u5oyJ57qm5a6a5aSE55CGXG4gICAgICAvLyB7XG4gICAgICAvLyAgIGNvZGU6IDIwMCwgLy8g6Ieq5a6a5LmJ54q25oCB56CB77yMMjAwIOaIkOWKn++8jOmdniAyMDAg5Z2H5LiN5oiQ5YqfXG4gICAgICAvLyAgIG1zZzogJ+aTjeS9nOaPkOekuicsIC8vIOS4jeiDveWSjCBkYXRhIOWFseWtmFxuICAgICAgLy8gICBkYXRhOiB7fSAvLyDnlKjmiLfmlbDmja5cbiAgICAgIC8vIH1cbiAgICAgICdyZXNwb25zZSc6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIOacjeWKoeerr+i/lOWbnueahOacieaViOeUqOaIt+aVsOaNrlxuICAgICAgICB2YXIgZGF0YSwgY29kZTtcbiAgICAgICAgdmFyIGN1cnJlbnRfcGF0aCA9ICRsb2NhdGlvbi5wYXRoKCk7XG5cbiAgICAgICAgaWYgKGFuZ3VsYXIuaXNPYmplY3QocmVzcG9uc2UuZGF0YSkpIHtcbiAgICAgICAgICAvLyDoi6Xlk43lupTmlbDmja7kuI3nrKblkIjnuqblrppcbiAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5jb2RlID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb2RlID0gcmVzcG9uc2UuZGF0YS5jb2RlO1xuICAgICAgICAgIGRhdGEgPSByZXNwb25zZS5kYXRhLmRhdGE7XG5cbiAgICAgICAgICAvLyDoi6Ugc3RhdHVzIDIwMCwg5LiUIGNvZGUgITIwMO+8jOWImei/lOWbnueahOaYr+aTjeS9nOmUmeivr+aPkOekuuS/oeaBr1xuICAgICAgICAgIC8vIOmCo+S5iO+8jGNhbGxiYWNrIOS8muaOpeaUtuWIsOS4i+mdouW9ouW8j+eahOWPguaVsO+8mlxuICAgICAgICAgIC8vIHsgY29kZTogMjAwMDEsIG1zZzogJ+aTjeS9nOWksei0pScgfVxuICAgICAgICAgIGlmIChjb2RlICE9PSAyMDApIHtcbiAgICAgICAgICAgIGlmIChjb2RlID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgT0F1dGgucjQwMShjdXJyZW50X3BhdGgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOiLpeacjeWKoeerr+i/lOWbnueahCBkYXRhICFudWxs77yM5YiZ6L+U5Zue55qE5piv5pyJ5pWI5Zyw55So5oi35pWw5o2uXG4gICAgICAgICAgLy8g6YKj5LmI77yMY2FsbGJhY2sg5Lya5o6l5pS25Yiw5LiL6Z2i5b2i5byP5Y+C5pWw77yaXG4gICAgICAgICAgLy8geyBpdGVtczogWy4uLl0sIHRvdGFsX2NvdW50OiAxMDAgfVxuICAgICAgICAgIGlmIChkYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSBkYXRhO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOiLpeacjeWKoeerr+i/lOWbnueahCBkYXRhIOWAvOS4uiBudWxs77yM5YiZ6L+U5Zue55qE5piv5o+Q56S65L+h5oGvXG4gICAgICAgICAgLy8g6YKj5LmIIGNhbGxiYWNrIOS8muaOpeaUtuWIsOS4i+mdouW9ouW8j+eahOWPguaVsO+8mlxuICAgICAgICAgIC8vIHsgY29kZTogMjAwLCBtc2c6ICfmk43kvZzmiJDlip8nIH1cbiAgICAgICAgICAvLyDpu5jorqTkuLrmraRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIOWTjeW6lOWHuumUme+8jOS6pOe7mSBlcnJvciBjYWxsYmFjayDlpITnkIZcbiAgICAgICdyZXNwb25zZUVycm9yJzogZnVuY3Rpb24ocmVqZWN0aW9uKSB7XG4gICAgICAgIHZhciBjdXJyZW50X3BhdGggPSAkbG9jYXRpb24ucGF0aCgpO1xuXG4gICAgICAgIGlmIChyZWplY3Rpb24uc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICBPQXV0aC5yNDAxKGN1cnJlbnRfcGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7IiwiLyogZ2xvYmFsIGFuZ3VsYXIqL1xuYW5ndWxhclxuICAubW9kdWxlKCd1dGlsLm9hdXRoJywgWydMb2NhbFN0b3JhZ2VNb2R1bGUnXSlcbiAgLmZhY3RvcnkoJ09BdXRoJywgZnVuY3Rpb24oJGxvZywgJGxvY2F0aW9uLCBsb2NhbFN0b3JhZ2VTZXJ2aWNlKSB7XG4gICAgdmFyIG9hdXRoX2xvY2FsX2tleSA9ICdvYXV0aCc7XG5cbiAgICB2YXIgb2F1dGhfY29uZiA9IHtcbiAgICAgIGNsaWVudF9pZDogJ1hlYXgyT01nZUxRUER4ZlNscklaM0JacXRGSE1uQldJaHBBS083YWonLFxuICAgICAgY2xpZW50X3NlY3JldDogJ3FCNWZON0tmSHlhMDBBcHpQOXBsSXIzdXBCWm9SVXZpM2hiYThERE1mNE9TOGJIWFJmQzNRMGdHSkJxTnMxV25oRmZmRlp3S1ZhTWFBSXM3dmNaaDRqTXpiWEVqRnJKSVozSXBjVjdjQXhRb3ZXMmhVVDlxbVFLaGpPOG5Bc0lNJyxcbiAgICAgIGdyYW50X3R5cGU6ICdwYXNzd29yZCdcbiAgICB9O1xuXG4gICAgdmFyIE9BdXRoID0ge1xuICAgICAgY29uZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBvYXV0aF9jb25mO1xuICAgICAgfSxcblxuICAgICAgcjQwMTogZnVuY3Rpb24oY3VyX3BhdGgpIHtcbiAgICAgICAgJGxvY2F0aW9uLnVybCgnL2xvZ2luJyk7XG4gICAgICAgICRsb2NhdGlvbi5zZWFyY2goJ3JlZGlyZWN0JywgY3VyX3BhdGgpO1xuICAgICAgfSxcblxuICAgICAgaGVhZGVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0b2tlbnMgPSB0aGlzLmxvY2FsKCk7XG4gICAgICAgIHZhciBoZWFkZXJzID0ge307XG5cbiAgICAgICAgaWYgKHRva2Vucykge1xuICAgICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IHRva2Vucy50b2tlbl90eXBlICsgJyAnICsgdG9rZW5zLmFjY2Vzc190b2tlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfSxcblxuICAgICAgbG9jYWw6IGZ1bmN0aW9uKHRva2Vucykge1xuICAgICAgICBpZiAodG9rZW5zKSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlU2VydmljZS5zZXQob2F1dGhfbG9jYWxfa2V5LCB0b2tlbnMpO1xuXG4gICAgICAgICAgcmV0dXJuIHRva2VucztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2VTZXJ2aWNlLmdldChvYXV0aF9sb2NhbF9rZXkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gT0F1dGg7XG4gIH0pOyIsIid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKFwibmdMb2NhbGVcIiwgW10sIFtcIiRwcm92aWRlXCIsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gIHZhciBQTFVSQUxfQ0FURUdPUlkgPSB7XG4gICAgWkVSTzogXCJ6ZXJvXCIsXG4gICAgT05FOiBcIm9uZVwiLFxuICAgIFRXTzogXCJ0d29cIixcbiAgICBGRVc6IFwiZmV3XCIsXG4gICAgTUFOWTogXCJtYW55XCIsXG4gICAgT1RIRVI6IFwib3RoZXJcIlxuICB9O1xuICAkcHJvdmlkZS52YWx1ZShcIiRsb2NhbGVcIiwge1xuICAgIFwiREFURVRJTUVfRk9STUFUU1wiOiB7XG4gICAgICBcIkFNUE1TXCI6IFtcbiAgICAgICAgXCJcXHU0ZTBhXFx1NTM0OFwiLFxuICAgICAgICBcIlxcdTRlMGJcXHU1MzQ4XCJcbiAgICAgIF0sXG4gICAgICBcIkRBWVwiOiBbXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU2NWU1XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTAwXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZThjXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTA5XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU1NmRiXCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU0ZTk0XCIsXG4gICAgICAgIFwiXFx1NjYxZlxcdTY3MWZcXHU1MTZkXCJcbiAgICAgIF0sXG4gICAgICBcIk1PTlRIXCI6IFtcbiAgICAgICAgXCIxXFx1NjcwOFwiLFxuICAgICAgICBcIjJcXHU2NzA4XCIsXG4gICAgICAgIFwiM1xcdTY3MDhcIixcbiAgICAgICAgXCI0XFx1NjcwOFwiLFxuICAgICAgICBcIjVcXHU2NzA4XCIsXG4gICAgICAgIFwiNlxcdTY3MDhcIixcbiAgICAgICAgXCI3XFx1NjcwOFwiLFxuICAgICAgICBcIjhcXHU2NzA4XCIsXG4gICAgICAgIFwiOVxcdTY3MDhcIixcbiAgICAgICAgXCIxMFxcdTY3MDhcIixcbiAgICAgICAgXCIxMVxcdTY3MDhcIixcbiAgICAgICAgXCIxMlxcdTY3MDhcIlxuICAgICAgXSxcbiAgICAgIFwiU0hPUlREQVlcIjogW1xuICAgICAgICBcIlxcdTU0NjhcXHU2NWU1XCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTRlMDBcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NGU4Y1wiLFxuICAgICAgICBcIlxcdTU0NjhcXHU0ZTA5XCIsXG4gICAgICAgIFwiXFx1NTQ2OFxcdTU2ZGJcIixcbiAgICAgICAgXCJcXHU1NDY4XFx1NGU5NFwiLFxuICAgICAgICBcIlxcdTU0NjhcXHU1MTZkXCJcbiAgICAgIF0sXG4gICAgICBcIlNIT1JUTU9OVEhcIjogW1xuICAgICAgICBcIjFcXHU2NzA4XCIsXG4gICAgICAgIFwiMlxcdTY3MDhcIixcbiAgICAgICAgXCIzXFx1NjcwOFwiLFxuICAgICAgICBcIjRcXHU2NzA4XCIsXG4gICAgICAgIFwiNVxcdTY3MDhcIixcbiAgICAgICAgXCI2XFx1NjcwOFwiLFxuICAgICAgICBcIjdcXHU2NzA4XCIsXG4gICAgICAgIFwiOFxcdTY3MDhcIixcbiAgICAgICAgXCI5XFx1NjcwOFwiLFxuICAgICAgICBcIjEwXFx1NjcwOFwiLFxuICAgICAgICBcIjExXFx1NjcwOFwiLFxuICAgICAgICBcIjEyXFx1NjcwOFwiXG4gICAgICBdLFxuICAgICAgXCJmdWxsRGF0ZVwiOiBcInlcXHU1ZTc0TVxcdTY3MDhkXFx1NjVlNUVFRUVcIixcbiAgICAgIFwibG9uZ0RhdGVcIjogXCJ5XFx1NWU3NE1cXHU2NzA4ZFxcdTY1ZTVcIixcbiAgICAgIFwibWVkaXVtXCI6IFwieXl5eS1NLWQgYWg6bW06c3NcIixcbiAgICAgIFwibWVkaXVtRGF0ZVwiOiBcInl5eXktTS1kXCIsXG4gICAgICBcIm1lZGl1bVRpbWVcIjogXCJhaDptbTpzc1wiLFxuICAgICAgXCJzaG9ydFwiOiBcInl5LU0tZCBhaDptbVwiLFxuICAgICAgXCJzaG9ydERhdGVcIjogXCJ5eS1NLWRcIixcbiAgICAgIFwic2hvcnRUaW1lXCI6IFwiYWg6bW1cIlxuICAgIH0sXG4gICAgXCJOVU1CRVJfRk9STUFUU1wiOiB7XG4gICAgICBcIkNVUlJFTkNZX1NZTVwiOiBcIlxcdTAwYTVcIixcbiAgICAgIFwiREVDSU1BTF9TRVBcIjogXCIuXCIsXG4gICAgICBcIkdST1VQX1NFUFwiOiBcIixcIixcbiAgICAgIFwiUEFUVEVSTlNcIjogW3tcbiAgICAgICAgXCJnU2l6ZVwiOiAzLFxuICAgICAgICBcImxnU2l6ZVwiOiAzLFxuICAgICAgICBcIm1hY0ZyYWNcIjogMCxcbiAgICAgICAgXCJtYXhGcmFjXCI6IDMsXG4gICAgICAgIFwibWluRnJhY1wiOiAwLFxuICAgICAgICBcIm1pbkludFwiOiAxLFxuICAgICAgICBcIm5lZ1ByZVwiOiBcIi1cIixcbiAgICAgICAgXCJuZWdTdWZcIjogXCJcIixcbiAgICAgICAgXCJwb3NQcmVcIjogXCJcIixcbiAgICAgICAgXCJwb3NTdWZcIjogXCJcIlxuICAgICAgfSwge1xuICAgICAgICBcImdTaXplXCI6IDMsXG4gICAgICAgIFwibGdTaXplXCI6IDMsXG4gICAgICAgIFwibWFjRnJhY1wiOiAwLFxuICAgICAgICBcIm1heEZyYWNcIjogMixcbiAgICAgICAgXCJtaW5GcmFjXCI6IDIsXG4gICAgICAgIFwibWluSW50XCI6IDEsXG4gICAgICAgIFwibmVnUHJlXCI6IFwiKFxcdTAwYTRcIixcbiAgICAgICAgXCJuZWdTdWZcIjogXCIpXCIsXG4gICAgICAgIFwicG9zUHJlXCI6IFwiXFx1MDBhNFwiLFxuICAgICAgICBcInBvc1N1ZlwiOiBcIlwiXG4gICAgICB9XVxuICAgIH0sXG4gICAgXCJpZFwiOiBcInpoLWNuXCIsXG4gICAgXCJwbHVyYWxDYXRcIjogZnVuY3Rpb24obikge1xuICAgICAgcmV0dXJuIFBMVVJBTF9DQVRFR09SWS5PVEhFUjtcbiAgICB9XG4gIH0pO1xufV0pO1xuIiwiYW5ndWxhclxuICAubW9kdWxlKCdndWx1LmxvZ2luJylcbiAgXG4gIC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkcSwgJGxvY2F0aW9uLCAkdGltZW91dCwgdG9hc3RyLCBMb2dpblN2YywgT0F1dGgpIHtcbiAgICB2YXIgdm0gPSAkc2NvcGU7XG5cbiAgICB2bS5sb2dpbiA9IGxvZ2luO1xuXG4gICAgZnVuY3Rpb24gbG9naW4oKSB7XG4gICAgICByZXR1cm4gTG9naW5TdmNcbiAgICAgICAgLnNhdmUoYW5ndWxhci5leHRlbmQoT0F1dGguY29uZigpLCB7XG4gICAgICAgICAgdXNlcm5hbWU6IHZtLmpvYl9ubyxcbiAgICAgICAgICBwYXNzd29yZDogdm0ucGFzc3dvcmRcbiAgICAgICAgfSkpXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICBPQXV0aC5sb2NhbChyZXMudG9KU09OKCkpO1xuXG4gICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MocmVzLm1zZyB8fCAn55m75b2V5oiQ5Yqf77yM5q2j5Zyo5Li65L2g6Lez6L2sLi4uJyk7XG5cbiAgICAgICAgICB2YXIgcXMgPSAkbG9jYXRpb24uc2VhcmNoKCk7XG4gICAgICAgICAgJGxvY2F0aW9uLnVybChxcy5yZWRpcmVjdCB8fCAnL2luZGVudHMnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIHRvYXN0ci5lcnJvcihyZXMubXNnIHx8ICfnmbvlvZXlpLHotKXvvIzor7fph43or5UnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9KTsiLCJhbmd1bGFyXG4gIC5tb2R1bGUoJ2d1bHUubG9naW4uc3ZjcycsIFsnbmdSZXNvdXJjZSddKVxuICAuc2VydmljZSgnTG9naW5TdmMnLCBmdW5jdGlvbiAoJHJlc291cmNlKSB7XG4gICAgcmV0dXJuICRyZXNvdXJjZShBUElfU0VSVkVSUy5jc2VydmljZSArICcvb2F1dGgyL3Rva2VuJywgbnVsbCwge1xuICAgICAgc2F2ZToge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PXV0Zi04J1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgdHJhbnNmb3JtUmVxdWVzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHZhciBzdHIgPSBbXTtcbiAgICAgICAgICBcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgICAgfSwgc3RyKTtcblxuICAgICAgICAgIHJldHVybiBzdHIuam9pbignJicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
