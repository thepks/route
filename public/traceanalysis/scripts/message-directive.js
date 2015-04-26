(function() {

    var app = angular.module("messageLog", ["MessageLogService"]);

    app.directive('messageLog', ["MessageLogService", function(MessageLogService) {

        return {

            restrict: 'E',
            templateUrl: 'messageLog.html',
            controller: ["MessageLogService", function(MessageLogService) {
                this.isVisible = function() {
                    return MessageLogService.is_updated();
                };

                this.displayMessages = function(num) {
                    return MessageLogService.get_messages(num);
                };

                this.clearMessages = function() {
                    MessageLogService.clear_messages();
                };

                this.hideMessages = function() {
                    MessageLogService.clear_updated();
                };

            }],
            controllerAs: 'messageLogCtrl'
        };

    }]);

})();