(function() {

    var app = angular.module('MessageLogService', []);
    
    var messages = [];
    var updated = false;

    app.factory("MessageLogService", function() {


        return {
            
            add_message : function(message){
                messages.push(message);  
                updated = true;
            },
            
            clear_messages : function() {
                messages = [];
            },
            
            get_messages : function (num) {
                
                if (!num || num<0) {
                    num = 0;
                }
                return messages.slice(-num);
                
            },
            
            is_updated : function() {
                return updated;
            },
            
            clear_updated: function() {
                updated = false;
            }
            


        };
    });
})();