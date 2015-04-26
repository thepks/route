(function() {

    var app = angular.module('JobDataService', []);

    var programNames = ['Please logon first'];
    
    var logged_on = false;
    var logged_on_user;
    var logged_on_roles;
    var logged_on_company;

    function calc_approx_week(dt) {

        var yr = dt.getFullYear();
        var approx_yr_start = yr + "-01-01T00:00:00.000Z";
        var startdtsecs = Date.parse(approx_yr_start);
        var dtsecs = dt.getTime();

        var week = (dtsecs - startdtsecs) / 604800000;
        return Math.floor(week);

    }


    function to_key_value(val) {
        return val + '\u9999';
    }

    function form_from_key() {
        var togo = "[\"";
        for (var i = 0; i < arguments.length; i++) {
            togo = togo + arguments[i] + "\"";
            if (arguments.length > i + 1) {
                togo = togo + ",\"";
            }
        }
        togo += "]";
        return togo;
    }

    function form_to_key() {
        var togo = "[\"";
        for (var i = 0; i < arguments.length; i++) {
            togo = togo + arguments[i] + "\u9999\"";
            if (arguments.length > i + 1) {
                togo = togo + ",\"";
            }
        }
        togo += "]";
        return togo;
    }
    
    function apply_standard_program(progname) {
        var namespace;
        
        if (progname) {
            namespace = progname.split(/\//);
            if (namespace.length == 1) {
                if (namespace[0].indexOf("Z") === 0 || namespace[0].indexOf("Y") === 0) {
                    return "Custom";
                } else if (namespace[0] === "RFKK_MASS_ACT_SINGLE_JOB") {
                    return "Mass";
                } else {
                    return "Standard";
                }
            } else {
                return namespace[1];
            }
        } else {
            return "Unknown";
        }
    }
    
    function apply_standard_company(roles) {
        
        for (var i = 0; i < roles.length; i++) {
            if (roles[i].indexOf("JOB_CO") === 0) {
                return roles[i].split(/_/)[2];
            }
        }
        return "Check Roles";
    
    }
    


    var program_types = ['Any', 'Standard', 'Custom', 'Mass', 'Namespace'];




    app.factory("JobDataService", ["$http", "$q", function($http, $q) {


        return {

            authenticate: function(username, password) {
                var userobj = {};
                userobj.user = {};
                userobj.user.username = username;
                userobj.user.password = password;

                return $http.post("/action/logon", userobj);
            },

            set_auth_status : function(username, roles, company) {
                logged_on_user = username;
                logged_on_roles = roles;
                logged_on_company = company;
                logged_on = true;
            },
            
            clear_auth_status : function() {
                logged_on = false;
                logged_on_user = '';
                logged_on_roles = '';
            },
            
            get_auth_status : function() {
                var togo ={};
                togo.logged_on = logged_on;
                togo.username = logged_on_user;
                togo.roles = logged_on_roles;
                return togo;
            },

            end_session: function() {

                return $http.delete("/action/logoff");

            },
            
            create_user: function(user, pass, company) {
                
                var comp = company;
                var roles = 'user';
                var id = {};
                id._id = user;
                id.name = user;
                id.roles = roles;
                id.type = 'user';
                id.password = pass;
                id.withCredentials = true;
                
                return $http.put("/jobs/"+user , JSON.stringify(id));
                
            },

            list_users: function(search) {
                
                var url = '/jobs/_design/useradmin/_view/userlist?include_docs=true';
                if (search.length > 0) {
                    url = url + '&startkey="'+search+'"&endkey="'+search+'\u9999"';
                } 
                return $http.get(url);
            },
            
            delete_user: function(user, rev) {
                var url = '/jobs/'+user+'?rev='+rev;
                return $http.delete(url);
            },
            
            update_user: function(user) {
                
                var url = '/jobs/'+user.doc.name;
                
                if(user.password && user.password.length > 0 && user.password === user.password2) {
                    user.doc.password = user.password;   
                }
                
                return $http.put(url,user.doc);
                
            },

            job_stats: function(program_name, from_date, to_date) {

                var startkey = form_from_key(program_name, from_date,logged_on_company);
                var endkey = form_to_key(program_name, to_date,logged_on_company);

                var url = '/jobs/_design/job_stats/_view/job_stats?group=true&level=exact';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;

                return $http.get(url);

            },

            job_duration: function(program_name, from_date, to_date) {

                var startkey = form_from_key(program_name, from_date, logged_on_company);
                var endkey = form_to_key(program_name, to_date, logged_on_company);

                var url = '/jobs/_design/job_stats/_list/duration/job_summary?group=true&level=exact';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;

                return $http.get(url);

            },


            parallel_calls: function(program_name, from_date, to_date) {

                var startkey = form_from_key(program_name, from_date, logged_on_company);
                var endkey = form_to_key(program_name, to_date, logged_on_company);


                var url = '/jobs/_design/job_details/_list/parallel_calls/server?';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;

                return $http.get(url);

            },

            processing_characteristics: function(program_name, from_date, to_date) {

                var startkey = form_from_key(program_name, from_date, logged_on_company);
                var endkey = form_to_key(program_name, to_date, logged_on_company);

                var url = '/jobs/_design/job_stats/_list/proc_percentages/abap_db_split?group=true&level=exact&';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;

                return $http.get(url);

            },

            general_stats: function(from_date, to_date) {

                var startkey = form_from_key("{}", from_date);
                var endkey = form_to_key("", to_date);

                var url = '/jobs/_design/job_stats/_view/job_stats?group=true&level=exact';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;
                return $http.get(url);

            },

            job_weekly_change_gradient: function(from_date, to_date) {

                var startdt = new Date(from_date);
                var enddt = new Date(to_date);
                var startwk = calc_approx_week(startdt);
                var endwk = calc_approx_week(enddt);

                var startkey = form_from_key("", startwk);
                var endkey = form_to_key("", endwk);


                var url = '/jobs/_design/job_stats/_list/deg_by_week/job_weekly_stats?group=true&level=exact';
                url = url + '&startkey=' + startkey;
                url = url + '&endkey=' + endkey;

                return $http.get(url);

            },


            program_names: function() {
                return programNames;
            },

            program_types: function() {
                return program_types;
            },

            form_program_type: function(program_type, namespace) {
                var ptype = '';
                if (program_type && program_type !== 'Any') {
                    ptype = program_type;
                }

                if (program_type && program_type === 'Namespace') {
                    ptype = namespace;
                }
                return ptype;
            },

            filter_results: function(data, program_type, company) {
                var data_rows = [];
                var togo = {};
                if (program_type === "") {
                    return data;
                }
                

                for (var i = 0; i < data.rows.length; i++) {

                    var key = data.rows[i].key;
                    var ptype = key[3];
                    var cval = key[2]
                    if (program_type === ptype) {
                        if(company && company.length > 0) {
                            if (company === cval) {
                                data_rows.push(data.rows[i]);    
                            }
                        } else {
                            data_rows.push(data.rows[i]);
                        }
                    }
                }
                togo.rows = data_rows;
                return togo;
            },

            filter_results_change: function(data, program_type, company) {
                var data_rows = [];
                var togo = {};
                if (program_type === "") {
                    return data;
                }


                for (var i = 0; i < data.rows.length; i++) {

                    var key = data.rows[i].key;
                    var value = data.rows[i].value;
                    var split_key = key.split(/\|/g);
                    var ptype = split_key[1];
                    var cval = split_key[2];
                    if (program_type === ptype && value !== 0) {
                        if(company && company.length > 0) {
                            if (company === cval) {
                                data_rows.push(data.rows[i]);    
                            }
                        } else {
                            data_rows.push(data.rows[i]);
                        }
                    }
                }
                togo.rows = data_rows;
                return togo;
            },

            populate_program_names: function() {

                var deferred = $q.defer();

                var startkey = form_from_key(logged_on_company);
                var endkey = form_to_key(logged_on_company);

                var url = '/jobs/_design/job_details/_view/owner?group=true&level=exact&startkey='+startkey+"&endkey="+endkey;
                var duplist = [];
                var deduplist = [];
                var data;

                $http.get(url).
                success(function(data) {
                    if (typeof(data) !== 'object' || !('rows' in data)) {
                        deferred.reject('Failed to get a valid reply to job type listing request');
                        return;
                    }
                    duplist = data.rows.map(function(a) {
                        return a.key[1];
                    });

                    deduplist = duplist.reduce(function(a, b) {
                        if (a.indexOf(b) < 0) {
                            a.push(b);
                        }
                        return a;
                    }, []);

                    programNames = deduplist;

                    deferred.resolve();
                }).
                error(function() {
                    deferred.reject();
                });

                return deferred.promise;

            },
            
            file_upload: function(jobs) {
                // each record needs the user record and company adding
                for (var v=0; v<jobs.docs.length; v++) {
                    jobs.docs[v].owner = logged_on_user;
                    jobs.docs[v].company = logged_on_company;
                    jobs.docs[v].Progtype = apply_standard_program(jobs.docs[v].Progname);
                }
                return $http.post("/jobs/_bulk_docs", JSON.stringify(jobs));
            },

            reset_program_names: function() {
                programNames = ['Please logon'];
            }
        };

    }]);
})();