(function() {
    var app = angular.module('UploadController', ["JobDataService", "MessageLogService"]);
    
    function get_upload_object(data) {

        var config = {
            "job_field": "1",
            "start_date_field": "Strtdate",
            "start_time_field": "Strttime",
            "end_date_field": "Enddate",
            "end_time_field": "Endtime",
            "duration_field": "Duration",
            "status_field": "S",
            "cpu_field": "CPU ms",
            "db_field": "DB ms",
            "prog_field": "Progname"
        };


        var last_pos = 0;
        var is_mass = false;
        var first = true;
        var col = [];

        var field_names = [];
        var lines = data;
        var job_list = [];
        var job = {};

        //          console.log(lines[0]);
        for (var l = 0; l < lines.length; l++) {
            if (lines[l].trim().length < 1) {
                continue;
            }
            is_mass = false;
            if (first) { // First line describes file columns
                first = false;
                var fields = lines[l].split(/ +/);
                //                  console.log('>>>'+fields+'<<<'+fields.length);
                for (var i = 0; i < fields.length; i++) {
                    if (!fields[i].match(/[A-Z]/)) {
                        if (fields[i] === 'lc') {
                            i += 2;
                            continue;
                        }
                        if (i > 0) {
                            fields[i - 1] = fields[i - 1] + ' ' + fields[i];
                            field_names.pop();
                            field_names.push(fields[i - 1]);

                        }
                    } else {
                        field_names.push(fields[i]);
                    }
                } // Find the column widths
                for (var j = 0; j < field_names.length; j++) {
                    last_pos = lines[l].indexOf(field_names[j], last_pos);
                    col.push(last_pos);
                }

            } else { // rest of the file is the data
                job = {};
                var val;
                var strtdate;
                var tf;

                for (var w = 0; w < col.length; w++) {
                    if (w < col.length - 1) {
                        val = lines[l].slice(col[w], col[w + 1] - 1);
                    } else {
                        val = lines[l].slice(col[w]);
                    }
                    if (w == config.job_field) {
                        // Look for mass
                        job[field_names[w]] = val.toString().trim().split(/ +/)[0];

                    } else if (field_names[w] === config.start_time_field) {
                        strtdate = job[config.start_date_field];
                        tf = val.split(':');
                        val = new Date(strtdate.getFullYear(), strtdate.getMonth(), strtdate.getDate(), tf[0], tf[1], tf[2]);
                        job[field_names[w]] = val;
                    } else if (field_names[w] === config.end_time_field) {
                        strtdate = job[config.end_date_field];
                        tf = val.split(':');
                        val = new Date(strtdate.getFullYear(), strtdate.getMonth(), strtdate.getDate(), tf[0], tf[1], tf[2]);
                        job[field_names[w]] = val;
                    } else if (field_names[w] === config.start_date_field || field_names[w] === config.end_date_field) {

                        val = sap_date(val);
                        job[field_names[w]] = val;
                    } else {

                        //                console.log(val);
                        //if (w ==
                        job[field_names[w]] = val.toString().trim().split(/ +/)[0];
                    }
                }
                //            console.log(job);
                job.type = "JobRecord";
                job.structure = "v0.1";
                job_list.push(job);


            }
        }

        var upload_list = {
            docs: job_list
        };

        return upload_list;
    }


    function parse_html(data) {
        var lines = data;

        var a = 0;
        var maxlen = lines.length;
        console.log('Length is ' + maxlen);
        var linepos, linepos2, linepos3;
        var r, q, q2, q3, q4;
        var processed = '';
        while (a < maxlen) {
            linepos = lines.indexOf('nobr', a);
            if (linepos == -1) {
                break;
            }

            linepos2 = lines.indexOf('>', linepos) + 1;
            linepos3 = lines.indexOf('<', linepos2);
            r = lines.slice(linepos2, linepos3);
            q = r.replace(/&nbsp;/g, ' ');
            q2 = q.replace(/&amp;/g, '&');
            q3 = q2.replace(/&lt;/g, '<');
            q4 = q3.replace(/&#38;/g, '&');
            if (q4.trim().length > 1) {
                processed = processed + q4 + '\n';
            }

            a = linepos3;
        }

        var line_array = processed.split("\n");
        //console.log(processed[0]);
        /*    var line_cnt = 0;
         for (var l in line_array) {
             line_cnt++;
         }
     */
        return line_array;

    }
    
    function sap_date(dt) {
        var parts = dt.split(".");
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }



    app.controller('UploadController', ["JobDataService" , "MessageLogService", function(JobDataService, MessageLogService) {
        
        this.file_upload = '';

        this.upload = function() {

        var data = get_upload_object(parse_html(this.file_upload));
        JobDataService.file_upload(data).
        success(function(d) {
            MessageLogService.add_message("Upload completed successfully.");
        }).
        error(function(error) {
            MessageLogService.add_message("Upload failed " + error);
        });

        };



    }]);



})();