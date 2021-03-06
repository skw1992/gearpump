/*
 * Licensed under the Apache License, Version 2.0
 * See accompanying LICENSE file.
 */

angular.module('dashboard')

  .config(['$stateProvider',
    function($stateProvider) {
      'use strict';

      $stateProvider
        .state('streamingapp.processor', {
          url: '/processor/:processorId',
          templateUrl: 'views/apps/streamingapp/processor.html',
          controller: 'StreamingAppProcessorCtrl'
        });
    }])

  .controller('StreamingAppProcessorCtrl', ['$scope', '$state', '$stateParams', '$propertyTableBuilder',
    function($scope, $state, $stateParams, $ptb) {
      'use strict';

      $scope.processor = $scope.activeProcessor ||
        $scope.dag.processors[$stateParams.processorId];
      if (!$scope.processor) {
        return $state.go('streamingapp.overview', {appId: $stateParams.appId});
      }

      $scope.processorInfoTable = [
        $ptb.text('Task Class').done(),
        $ptb.number('Parallelism').done(),
        $ptb.text('Processing Type').done(),
        $ptb.datetime('Birth Time').done(),
        $ptb.datetime('Death Time').done()
      ];

      function describeProcessorType(inputs, outputs) {
        if (inputs === 0) {
          return outputs > 0 ? 'Source Processor (%s out)'.replace('%s', outputs) : 'Orphan';
        } else if (outputs === 0) {
          return inputs > 0 ? 'Sink Processor (%s in)'.replace('%s', inputs): 'Orphan';
        }
        return 'Transit Processor (%s in %s out)'.replace('%s', inputs).replace('%s', outputs);
      }

      function updateProcessorInfoTable(processor) {
        var connections = $scope.dag.calculateProcessorConnections(processor.id);
        $ptb.$update($scope.processorInfoTable, [
          processor.taskClass,
          processor.parallelism,
          describeProcessorType(connections.inputs, connections.outputs),
          processor.life.birth <= 0 ?
            'Start with the application' : processor.life.birth,
          processor.life.death === '9223372036854775807' /* Long.max */ ?
            'Not specified' : processor.life.death
        ]);

        $scope.tasks = {
          selected: [],
          available: function() {
            var array = [];
            for (var i = 0; i < processor.parallelism; ++i) {
              array.push('T' + i);
            }
            return array;
          }()
        };

        // if only processor has only one task, select it by default. Corresponding charts will be shown automatically.
        if ($scope.tasks.available.length === 1) {
          $scope.tasks.selected = $scope.tasks.available;
        }
      }

      updateProcessorInfoTable($scope.processor);

      var skewDataOption = {
        height: '110px',
        colors: ['rgb(93,201,242)'],
        seriesNames: [''],
        barMinWidth: 10,
        barMinSpacing: 2,
        valueFormatter: function(value) {
          return Number(value).toFixed(0) + ' msg/s';
        },
        data: _.map($scope.tasks.available, function(taskName, i) {
          return {x: taskName, y: '-'};
        })
      };

      $scope.$watchCollection('dag.metrics.meter', function() {
        var data = $scope.dag.getReceivedMessages($scope.processor.id).rate;
        $scope.receiveSkewChart.data = _.map($scope.tasks.available, function(taskName, i) {
          return {x: taskName, y: data[i]};
        });
      });

      $scope.receiveSkewChart = {
        options: skewDataOption
      };
    }])
;