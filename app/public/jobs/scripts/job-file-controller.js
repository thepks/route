jobFileController = function() {

    var initialised = false;
    var self;


    return {

        init: function() {
            self = this;

            $('#importFile').change(self.loadFromHTML2);
            initialised = true;
        },

        loadFromHTML2: function(event) {

            console.log('About to read');

            $('#load-feedback').text("Loading ... please wait");
            $('#load-feedback').show();


            var uploads = event.target.files.length;

            for (var i = 0; i < event.target.files.length; i++) {
                new file_parser(event.target.files[i]).
                then(upload_job_data).
                then(function() {
                    console.log('Upload done!');
                    uploads--;


                    if (uploads === 0) {

                        $('#load-feedback').text("Upload completed");

                        setTimeout(function() {
                            $('#load-feedback').hide();
                        }, 5000);


                    }



                },

                function(error) {

                    $('#load-feedback').text("An error occurred");

                    setTimeout(function() {
                        $('#load-feedback').hide();
                    }, 2000);


                });
            }

        },



    };


}();


function sap_date(dt) {
    var parts = dt.split(".");
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function upload_job_data(parsed_lines, id) {

    var deferred = $.Deferred();
    var token = id;
    var usr;
    var promise_upload;

    promise_upload = $.get("/_session", function(data, status) {
        console.log("Data " + data);
        var res = JSON.parse(data);
        console.log(res.userCtx.name);

        upload(parsed_lines, res.userCtx.name, res.userCtx.roles);
    });


    promise_upload.done(function() {
        deferred.resolve(token);
    });

    promise_upload.fail(function(jqXHR, textStatus, errorThrown) {
        deferred.reject(token, errorThrown);
    });


    return deferred.promise();
}


function upload(data, username, roles) {

    var deferred = $.Deferred();

    var promise_bulkupload;

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
    var company = apply_standard_company(roles);

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
            job.owner = username;
            job.company = company;
            job.Progtype = apply_standard_program(job.Progname);

            job_list.push(job);


        }
    }

    var upload_list = {
        docs: job_list
    };

    //console.log(JSON.stringify(upload));

    promise_bulkupload = $.ajax({
        url: "/jobs/_bulk_docs",
        type: "POST",
        data: JSON.stringify(upload_list),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });

    promise_bulkupload.done(function() {
        deferred.resolve();
    });

    promise_bulkupload.fail(function(data, status) {
        deferred.reject(data);
    });

    return deferred.promise();
}



function file_parser(f) {
    var deferred = $.Deferred();

    var reader = new FileReader();


    reader.onload = function(evt) {
        var parsed_lines = parse_html(evt.target.result);
        deferred.resolve(parsed_lines);
    };

    reader.onerror = function(evt) {
        deferred.reject(evt);
    };

    console.log('About to read');
    reader.readAsText(f);
    return deferred.promise();
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
    return line_array;

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
