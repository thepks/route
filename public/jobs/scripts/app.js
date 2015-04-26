(function() {
    var app = angular.module('jobAnalyser', ["UploadController", "JobGraphService", "JobDataService","MessageLogService", "messageLog", "fileReader"]);

    var option = 0;
    var job_data = false;
    var logged_on = false;
    var logon_error = 0;
    var logon_error_message;
    var username;
    var password;




    app.controller('JobController', ["JobDataService", "MessageLogService", function(JobDataService, MessageLogService) {

        this.setOption = function(value) {
            this.option = value;
        };

        this.isOption = function(value) {
            return this.option === value;
        };

        this.isErrorLogon = function() {
            return logon_error === 1;
        };

        this.logon = function() {
            console.log(this.username);
            var that = this;
            
            JobDataService.authenticate(this.username, this.password).
            success(function(data) {
                that.option = 1;
                that.logged_on = true;
                JobDataService.set_auth_status(that.username, data.roles, data.company);
                setTimeout(function() {
                    JobDataService.populate_program_names().
                    then(function() {
                        MessageLogService.add_message("Logon Complete");
                        
                    }, function(data) {
                        MessageLogService.add_message(data);
                        
                    });
                }, 200);
            }).
            error(function(data, status) {
                MessageLogService.add_message("Logon Failed! " + status);
            });


        };


        this.logoff = function() {
            console.log('In event logoff');
            this.logged_on = false;
            this.option = 1;

            JobDataService.end_session().
            then(function(data, status, headers) {
                JobDataService.reset_program_names();
                JobDataService.clear_auth_status();
                MessageLogService.clear_messages();
            },function(data, status) {
                console.log('failed to logoff');
            });

        };

        this.isLoggedOn = function() {
            return JobDataService.get_auth_status().logged_on;
        };

        this.isAdmin = function() {
            var roles = JobDataService.get_auth_status().roles;
            if (!roles) {
                return false;
            }
            for (var i = 0; i < roles.length; i++) {
                if (roles[i] === 'admin') {
                    return true;
                }
            }
            return false;
        };



    }]);


    app.controller('VariabilityController', ["JobGraphService", "JobDataService", function(JobGraphService, JobDataService) {

        this.historyFormData = {
            fromDate: new Date(),
            toDate: new Date(),
            program: '',
            programType: 'Any',
            company: '',
            namespace: ''
        };

        this.form_program_type = function(program_type, namespace) {
            var ptype = '';
            if (program_type && program_type !== 'ALL') {
                ptype = program_type;
            }

            if (program_type && program_type === 'Namespace') {
                ptype = namespace;
            }
            return ptype;
        };

        this.filter_results = function(data, program_type) {
            var data_rows = [];
            var togo = {};

            for (var i = 0; i < data.rows.length; i++) {

                var key = data.rows[i].key;
                var ptype = key[3];
                if (program_type === ptype) {
                    data_rows.push(data.rows[i]);
                }
            }
            togo.rows = data_rows;
            return togo;
        };



        this.history = function() {
            var that = this;

            this.data = false;
            if (this.historyFormData) {
                console.log(this.historyFormData);

                var from_date = this.historyFormData.fromDate;
                var to_date = this.historyFormData.toDate;
                var programType = this.historyFormData.programType;
                var namespace = this.historyFormData.namespace;
                var company = this.historyFormData.company;

                JobDataService.general_stats(from_date, to_date).
                success(function(data) {
                    var ptype = JobDataService.form_program_type(programType, namespace);
                    var new_data = JobDataService.filter_results(data, ptype, company);

                    JobGraphService.variability_graph(new_data, 'variability-results');
                });

                this.job_data = true;
            }
        };

        this.program_types = function() {
            return JobDataService.program_types();
        };

        this.isNamespace = function() {
            if (this.historyFormData.programType.length < 1) return false;
            return (this.historyFormData.programType === 'Namespace');
        };



    }]);

    app.controller('ChangeController', ["JobGraphService", "JobDataService", function(JobGraphService, JobDataService) {

        this.historyFormData = {
            fromDate: new Date(),
            toDate: new Date(),
            program: '',
            programType: 'Any',
            company: '',
            namespace: ''
        };



        this.history = function() {
            var that = this;

            this.job_data = false;
            if (this.historyFormData) {
                console.log(this.historyFormData);

                var from_date = this.historyFormData.fromDate;
                var to_date = this.historyFormData.toDate;
                var programType = this.historyFormData.programType;
                var namespace = this.historyFormData.namespace;
                var company = this.historyFormData.company;


                JobDataService.job_weekly_change_gradient(from_date, to_date).
                success(function(data) {
                    var ptype = JobDataService.form_program_type(programType, namespace);
                    var new_data = JobDataService.filter_results_change(data, ptype, company);
                    JobGraphService.change_graph(new_data, 'summary-reduce');
                });
                this.job_data = true;
            }
        };


        this.program_types = function() {
            return JobDataService.program_types();
        }

        this.isNamespace = function() {
            if (this.historyFormData.programType.length < 1) return false;
            return (this.historyFormData.programType === 'Namespace');
        }

    }]);


    app.controller('jobAdminController', ["JobDataService", "MessageLogService", function(JobDataService, MessageLogService) {
        this.searchuser = '';
        this.option = 0;
        this.newuser = '';
        this.newuserpwd = '';
        this.newusercompany = '';
        this.users = [];
        this.currentUser = {};

        this.search = function() {
            var that = this;
            this.option = 2;
            this.users = [];
            JobDataService.list_users(this.searchuser).
            success(function(data) {
                that.users = data.rows;
            });

        };

        this.setOption = function(val) {
            this.option = val;
        };

        this.isOption = function(val) {
            return this.option === val;
        };

        this.create = function() {
            that = this;
            JobDataService.create_user(this.newuser, this.newuserpwd, this.newusercompany).
            success(function(data) {
                MessageLogService.add_message("User Created");
                that.option = 0;
            });

        };

        this.edit = function(user) {
            this.currentUser = user;
            this.option = 3;
        };

        this.delete = function(user) {
            this.currentUser = user;
            this.option = 4;
        };

        this.update = function() {
            that = this;

            JobDataService.update_user(this.currentUser).success(function() {
                MessageLogService.add_message("User changed");
                that.option = 0;
            });

        };

        this.remove = function() {
            that = this;
            JobDataService.delete_user(this.currentUser.doc.name, this.currentUser.doc._rev).
            success(function() {
                MessageLogService.add_message("User Deleted");
                that.option = 0;

            });
        };

    }]);

    app.controller('HistoryController', ["JobGraphService", "JobDataService", function(JobGraphService, JobDataService) {

        this.historyFormData = {
            fromDate: new Date(),
            toDate: new Date(),
            program: '',
            programType: '',
            company: '',
            namespace: ''
        };


        this.program_names = function() {
            return JobDataService.program_names();
        };

        this.history = function() {
            if (this.historyFormData) {
                console.log(this.historyFormData);

                var program_name = this.historyFormData.program;
                var from_date = this.historyFormData.fromDate;
                var to_date = this.historyFormData.toDate;
                var programType = this.historyFormData.programType;
                var namespace = this.historyFormData.namespace;


                JobDataService.job_stats(program_name, from_date, to_date).
                success(function(data) {

                    JobGraphService.duration_overview(data, 'summary-results');
                });


                JobDataService.job_duration(program_name, from_date, to_date).
                success(function(data) {
                    JobGraphService.history_graph(data, 'summary-history');
                });


                JobDataService.parallel_calls(program_name, from_date, to_date).
                success(function(data) {
                    JobGraphService.concurrent_graph(data, 'summary-parallel');
                });


                JobDataService.processing_characteristics(program_name, from_date, to_date).
                success(function(data) {
                    JobGraphService.processing_graph(data, 'summary-processing');
                });

                this.job_data = true;
            }
        };


    }]);



})();