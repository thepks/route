(function() {

    var app = angular.module("fileReader", ["FileReaderService"]);

    app.directive('fileReader', ["FileReaderService", "$parse", function(FileReaderService, $parse) {

        return {

            restrict: 'E',
            template: '<input type="file" />',
            replace: true,
            scope: {
                text: '='
            },

            link: function(scope, element, attrs) {

                var onChange = $parse(attrs.onChange);
                scope.onComplete= $parse(attrs.onComplete);

                var updateModel = function() {
                    scope.$apply(function() {
                        scope.file = element[0].files[0];
                        onChange(scope);
                    });
                };

                element.bind('change', updateModel);
            },

            controller: ["$scope", "FileReaderService", function($scope, FileReaderService) {
                

                $scope.readFile = function() {
                    console.log($scope.file);
                    FileReaderService.readAsText($scope.file)
                        .then(function(result) {
                            $scope.text = result;
                    },function(result){
                        console.log('Error! ' + result);
                    });
                };

            }],
            controllerAs: 'fileReaderCtrl'
        };
    }]);

})();