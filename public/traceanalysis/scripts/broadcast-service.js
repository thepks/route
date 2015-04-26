(function() {

    var app = angular.module('BroadcastService', []);

    app.factory("BroadcastService", ["$rootScope", function($rootScope) {


    var broadcastObj = {};

        return {

            broadcast: function(topic, obj) {
                broadcastObj[topic] = obj;
                $rootScope.$broadcast(topic);
            },
            
            retrieve: function(topic) {
                return broadcastObj[topic];
            }
            
        };
    }]);
})();