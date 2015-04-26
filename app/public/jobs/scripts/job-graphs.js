(function() {

    var app = angular.module('JobGraphService', []);

    app.factory("JobGraphService", [ function() {

        return {


            duration_overview: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {
                        var data_rows = [];

                        for (var i = 0; i < raw_data.rows.length; i++) {

                            var count = raw_data.rows[i].value.count;
                            var avg = raw_data.rows[i].value.sum / count;
                            var stddev;
                            var lowval;
                            var highval;

                            if (count > 1) {
                                stddev = Math.sqrt((raw_data.rows[i].value.sumsqr - (raw_data.rows[i].value.sum * raw_data.rows[i].value.sum / count)) / (count - 1));
                                lowval = avg - stddev;
                                highval = avg + stddev;
                            } else {
                                lowval = raw_data.rows[i].value.min;
                                highval = raw_data.rows[i].value.max;
                            }

                            var new_row = [];
                            new_row = [
                            new Date(raw_data.rows[i].key[1].slice(0, 10)),
                            raw_data.rows[i].value.min,
                            lowval,
                            highval,
                            raw_data.rows[i].value.max];

                            data_rows.push(new_row);

                        }


                        var data = google.visualization.arrayToDataTable(data_rows, true);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 400,
                            hAxis: {
                                title: 'Date',
                                format: 'dd.MM.yy',
                                gridlines: {
                                    count: 10
                                }
                            },
                            vAxis: {
                                title: 'Time (s)'
                            },
                            legend: 'none'
                        };

                        var chart_lines = new google.visualization.CandlestickChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);

                    }
                });
            },

            history_graph: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {

                        var data_rows = [];

                        for (var i = 0; i < raw_data.rows.length; i++) {

                            var value = raw_data.rows[i].value;
                            var key = new Date(raw_data.rows[i].key[1].slice(0, 10));

                            var new_row = [];
                            new_row = [
                            key,
                            value];

                            data_rows.push(new_row);

                        }


                        var data = google.visualization.arrayToDataTable(data_rows, true);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 400,
                            hAxis: {
                                title: 'Date',
                                gridlines: {
                                    count: 10
                                }
                            },
                            vAxis: {
                                title: 'Time (s)'
                            },
                            legend: 'none'
                        };

                        var chart_lines = new google.visualization.ColumnChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);


                    }
                });

            },

            variability_graph: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {

                        var data_rows = [];
                        var prog_group = {};

                        for (var i = 0; i < raw_data.rows.length; i++) {

                            var progkey = raw_data.rows[i].key[0];
                            if (!(progkey in prog_group)) {
                                prog_group[progkey] = {};
                                prog_group[progkey].program = progkey;
                                prog_group[progkey].min = 999999999999999;
                                prog_group[progkey].max = 0;
                                prog_group[progkey].count = 0;
                                prog_group[progkey].sum = 0;
                                prog_group[progkey].sumsqr = 0;
                            }

                            prog_group[progkey].count += raw_data.rows[i].value.count;
                            prog_group[progkey].sum += raw_data.rows[i].value.sum;
                            prog_group[progkey].sumsqr += raw_data.rows[i].value.sumsqr;
                            if (prog_group[progkey].min > raw_data.rows[i].value.min) {
                                prog_group[progkey].min = raw_data.rows[i].value.min;
                            }
                            if (prog_group[progkey].max < raw_data.rows[i].value.max) {
                                prog_group[progkey].max = raw_data.rows[i].value.max;
                            }
                        }

                        for (var key in prog_group) {
                            var item = prog_group[key];
                            var cnt = item.count;
                            var sum = item.sum;
                            var sumsqr = item.sumsqr;
                            var avg = sum / cnt;
                            var min = item.min;
                            var max = item.max;
                            var program = item.program;

                            var stddev;
                            var lowval;
                            var highval;


                            if (cnt > 1) {
                                stddev = Math.sqrt((sumsqr - (sum * sum / cnt)) / (cnt - 1));
                                lowval = avg - stddev;
                                highval = avg + stddev;
                            } else {
                                lowval = min;
                                highval = max;
                            }

                            var new_row = [];
                            new_row = [
                            program,
                            min,
                            lowval,
                            highval,
                            max];

                            data_rows.push(new_row);

                        }



                        var data = google.visualization.arrayToDataTable(data_rows, true);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 563,
                            hAxis: {
                                title: 'Program',
                                gridlines: {
                                    count: 10
                                },
                                textStyle: {
                                    fontSize: 7
                                }
                            },
                            vAxis: {
                                title: 'Time (s)',
                            },
                            legend: 'none'
                        };

                        var chart_lines = new google.visualization.CandlestickChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);


                    }
                });

            },

            concurrent_graph: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {

                        var data_rows = [];

                        for (var i = 0; i < raw_data.rows.length; i++) {

                            var value = raw_data.rows[i].value;
                            var key = new Date(raw_data.rows[i].key[1]);

                            for (var interval in value) {
                                var new_row = [];
                                new_row = [
                                new Date(interval),
                                value[interval]];

                                data_rows.push(new_row);

                            }

                        }


                        var data = google.visualization.arrayToDataTable(data_rows, true);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 400,
                            hAxis: {
                                title: 'Time',
                                gridlines: {
                                    count: 10
                                }
                            },
                            vAxis: {
                                title: 'Concurrent WP'
                            },
                            legend: 'none'
                        };

                        var chart_lines = new google.visualization.ColumnChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);


                    }
                });
            },

            processing_graph: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {

                        var data_rows = [];
                        data_rows.push(['Date', 'CPU (ABAP)', 'DB']);


                        for (var i = 0; i < raw_data.rows.length; i++) {
                            var new_row = [];
                            var value = raw_data.rows[i].value;
                            var key = new Date(raw_data.rows[i].key[1].slice(0, 10));
                            new_row = [key,
                            value.abap,
                            value.db];

                            data_rows.push(new_row);

                        }


                        var data = google.visualization.arrayToDataTable(data_rows, false);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 400,
                            hAxis: {
                                title: 'Date',
                                gridlines: {
                                    count: 10
                                }
                            },
                            vAxis: {
                                title: 'Processing Percentage'
                            },
                            legend: {
                                position: 'top',
                                maxLines: 3
                            },

                            isStacked: true,
                        };

                        var chart_lines = new google.visualization.ColumnChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);

                    }
                });
            },

            change_graph: function(raw_data, dom_id) {

                google.load('visualization', '1.0', {
                    'packages': ['corechart'],
                    'callback': function() {

                        var data_rows = [];
                        data_rows.push(['Program', 'Change']);


                        for (var i = 0; i < raw_data.rows.length; i++) {
                            var new_row = [];
                            var value = raw_data.rows[i].value;
                            var key = raw_data.rows[i].key;
                            var key2 = key.split(/\|/g)[0];
                            new_row = [key2, value];

                            data_rows.push(new_row);

                        }


                        var data = google.visualization.arrayToDataTable(data_rows, false);

                        // Set chart options
                        var options_lines = {
                            width: 1000,
                            height: 1200,
                            hAxis: {
                                title: 'Change Factor',
                                gridlines: {
                                    count: 10
                                }
                            },
                            vAxis: {
                                title: 'Program',
                            },
                            legend: 'none',

                            isStacked: false
                        };

                        var chart_lines = new google.visualization.BarChart(document.getElementById(dom_id));
                        chart_lines.draw(data, options_lines);


                    }
                });

            }

        };

    }]);

})();