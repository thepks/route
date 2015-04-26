(function() {

    var app = angular.module('FileReaderService', []);

    app.factory("FileReaderService", ["$q", function($q) {

        return {
            readAsText: function(file) {
                var deferred = $q.defer();
                var reader = new FileReader();

                reader.onload = function() {
                    deferred.resolve(reader.result);
                };

                reader.onerror = function() {
                    deferred.reject(reader.result);
                };


                reader.readAsText(file);

                return deferred.promise;

            }
        };
    }]);
})();