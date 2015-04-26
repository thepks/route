(function() {

    var app = angular.module('TraceAnalysisService', []);

    var array_prune = function(a) {
        var tmp = [];
        tmp = a.filter(function(f) {
            if (f) {
                return true;
            } else {
                return false;
            }
        });
        return tmp;
    };
    
    var reduce_children = function(obj,reduction,parent) {


    for(var h=0; h < obj.length; h++) {
        if( 'children' in obj[h]) {
            reduce_children(obj[h].children, reduction, obj[h]);
        }
    }
    for (var i=obj.length-1; i> 0; i--){
        if(obj[i].net < reduction) {
            // SIBLING 0 rather than parent actually holds the net value I want to increase
            if (parent) {
                obj[0].net += obj[i].net
                delete obj[i];
            }
        }
    }

    // clean obj of null entries from delete    

    if (parent && 'children' in parent) {
        parent.children = array_prune(obj);
    }

    };

    

    app.factory("TraceAnalysisService", function() {

        return {

            parse: function(file, threshold, reduction) {

                var call_list_stack = [];
                var working_stack = [];
                var object_stack = [];
                var target_stack = [];
                var call_obj = {};
                var object_stack_sum = 0;
                var net_value = 0;
                var gross_value = 0;
                var target_value = 0;
                var moving_object = {};
                var target_object = {};
                var line_list = file.split('\n');
                var first = true;
                var found = false;
                var thresh = threshold;

                /* Open and parse file */
                for (var l = 0; l < line_list.length; l++) {
                    if (line_list[l].trim().length < 1) {
                        continue;
                    }
                    if (first) { // First line describes file columns
                        first = false;
                        continue;
                    }

                    var fields = line_list[l].split(/\|/);
                    if (fields.length < 3) {
                        continue;
                    }
                    call_obj = {};
                    var itm = fields[1].replace(/,/g, '').trim();
                    call_obj.name = itm + '-' + fields[2];
                    call_obj.item = itm;

                    try {
                        call_obj.gross = parseInt(fields[3].replace(/,/g, ''), 10);
                } catch(e) {}
                try{
                        call_obj.net = parseInt(fields[4].replace(/,/g, ''), 10);
                    } catch (e) {call_obj.net = 0;}

                if (isNaN(call_obj.net)) {
                call_obj.net = 0;
                }


                    if ('gross' in call_obj && 'net' in call_obj && 'name' in call_obj && !isNaN(call_obj.gross)) {

                        call_obj.true_net = call_obj.net;

                        /* push objects to the stack */
            if (call_obj.net > 0 || call_obj.gross > 0) {
                            call_list_stack.push(call_obj);
            }
                    }
                }

                /* while obj on the stack */

                while (call_list_stack.length > 0) {

                    /*shift item at top, which is actually the last item to working stack */
                    moving_object = call_list_stack.pop();
                    net_value = moving_object.net;

            // since a new object the gross has to be set to this one
                    gross_value = moving_object.gross;

                    // filter, don't try to describe less than the gross value threshold, just move to the output stack
                    if (gross_value < thresh || net_value >= gross_value) {
                        target_stack.push(moving_object);
                        continue;
                    }

            // let the target be this one
                    target_object = moving_object;

                    /*check if accumulated value greater than top object gross time */
                    if (net_value < gross_value) {
                        // find items within here, i.e we are now going to build a new stack until we reach the gross time
                        /* form a new stack for the last object*/
                        object_stack = [];

            // current running total is just this one, as others are pulled this will be incremented
                        object_stack_sum = target_object.net;
                        found = false;

            // pull items from the target stack to see if these can combine to give the target gross value
                        while (target_stack.length > 0) {

                // get the last added
                            moving_object = target_stack.pop();

                // get its net value    
                            try {
                                net_value = moving_object.net;
                            } catch (e) {
                 // if something is wrong with the structure abandon all hope, previous checks have failed
                                net_value = 0;
                                found = true;
                            }

                // does this value combine to meet the target gross value
                            if (object_stack_sum + net_value <= gross_value && !found) {

                // if so complete the sum
                                object_stack_sum += net_value;

                // the target_object itself could already have its own children
                                if (!('children' in target_object)) {
                    
                    // if not then lets create them, include self
                                    target_object.children = [];
                                    var clone_object = {};
                                    clone_object.name = target_object.name+"*";
                                    clone_object.item = target_object.item;
                                    clone_object.net = target_object.true_net;
                                    clone_object.gross = target_object.gross;

                    // and push it it
                                    target_object.children.push(clone_object);
                                }
                // still in the this value needs to be added to your children list, add it in
                                target_object.children.push(moving_object);
                            } else {
                // now the target has been reached or all hope has been abandoned, add the objects found (including their children)
                                target_stack.push(moving_object);
                                break;
                            }

                        }

            // set the target objects net to the sume of its children (true net holds the original)

                        target_object.net = object_stack_sum;

                    }

            
            // and push the result onto the output stack
                    target_stack.push(target_object);

           // back to take the next object
                }

                console.log('Tree formed');
                
                // To reduce need to find the ends and then if they are less that reduce level consume them
                


        // now reduce the items

        reduce_children(target_stack,reduction,null);


                return target_stack;

            }

        };
    });
})();
