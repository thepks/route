(function() {

    var app = angular.module("nodeVisualisation", ["NodeTemplateService", "MessageLogService", "BroadcastService"]);


    var flattenTree = function(itemobj, threshold, parent) {

        var togo = {};
        var togolist = [];
        var togoobj = {};
        var offspring = [];


        for (var i = 0; i < itemobj.length; i++) {
            togo = {};
            togo.name = itemobj[i].name;
            if ('children' in itemobj[i]) {
                togo.children = [];

                for (var j = 0; j < itemobj[i].children.length; j++) {
                    togoobj = {};
                    togoobj.name = itemobj[i].children[j].name;

                    if ('children' in itemobj[i].children[j]) {
                        togoobj.children = [];
                        offspring = flattenTree(itemobj[i].children[j].children, threshold, itemobj[i].children[j].name);

                        for (var k = 0; k < offspring.length; k++) {
                            togoobj.children.push(offspring[k]);
                        }

                    } else {
                        togoobj.size = itemobj[i].children[j].net;
                    }
                    togo.children.push(togoobj);
                }
            } else {
                togo.size = itemobj[i].net;
            }
            togolist.push(togo);

        }

        return togolist;

    };



    app.directive('nodeVisualisation', ["NodeTemplateService", "MessageLogService", "BroadcastService", function(NodeTemplateService, MessageLogService, BroadcastService) {

        return {

            restrict: 'E',
            template: '<div id="gpOverview"></div>',
            templateNamespace: 'svg',
            link: function(scope, element, attrs) {


                scope.$on('gp-display-nodes', function() {

                var measure = parseInt( BroadcastService.retrieve('gp-measurement'));        
                    var data = BroadcastService.retrieve('gp-display-nodes');
                    var contentAt = attrs.instance;
                    var width, height;
                    height = parseInt(attrs.height);
                    width = parseInt(attrs.width);
                    var type = attrs.type;


                    if (type === 'partition') {

                        var newtree = flattenTree(data);

                        element.children().remove();
                        element.append("<div id=\"gpOverview" + contentAt + "\" class=\"model-overview\"></div>");

                        var margin = {
                            top: 40,
                            right: 10,
                            bottom: 10,
                            left: 10
                        };

                        var color = d3.scale.category20c();



                        var partition = d3.layout.partition() //treemap
                        .size([width, height])
                        //            .sticky(true)
                        .value(function(d) {
                            return d.size;
                        });



                        var div = d3.select("#gpOverview" + contentAt).append("div")
                            .style("position", "relative")
                            .style("width", (width + margin.left + margin.right) + "px")
                            .style("height", (height + margin.top + margin.bottom) + "px")
                            .style("left", margin.left + "px")
                            .style("top", margin.top + "px");

                        var divtip = div.append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0);


                        var node = div.datum(newtree[measure]).selectAll(".node")
                            .data(partition.nodes)
                            .enter().append("div")
                            .attr("class", "node")
                            .on("mouseover", function(d) {

                            divtip.transition()
                                .duration(200)
                                .style("opacity", .9);
                            divtip.html(d.name)
                                .style("left", d3.event.pageX + "px")
                                .style("top", this.offsetTop + "px");
                        })
                            .on("mouseout", function(d) {
                            divtip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        })
                            .call(function() {
                            this.style("left", function(d) {
                                return d.x + "px";
                            })
                                .style("top", function(d) {
                                return d.y + "px";
                            })
                                .style("width", function(d) {
                                return Math.max(0, d.dx - 1) + "px";
                            })
                                .style("height", function(d) {
                                return Math.max(0, d.dy - 1) + "px";
                            })
                        })
                            .style("background", function(d) {
                            return d.children ? color(d.name) : null;
                        })
                            .text(function(d) {
                            return d.name;
                            //                            return d.children ? null : d.name;
                        });

                        d3.selectAll("input").on("change", function change() {
                            var value = this.value === "count" ? function() {
                                    return 1;
                                } : function(d) {
                                    return d.size;
                                };

                            node.data(treemap.value(value).nodes)
                                .transition()
                                .duration(1500)
                                .call(function() {
                                this.style("left", function(d) {
                                    return d.x + "px";
                                })
                                    .style("top", function(d) {
                                    return d.y + "px";
                                })
                                    .style("width", function(d) {
                                    return Math.max(0, d.dx - 1) + "px";
                                })
                                    .style("height", function(d) {
                                    return Math.max(0, d.dy - 1) + "px";
                                });
                            });
                        });



                        console.log('Got here');

                    } else if (type === 'force') {
                        var gjson = NodeTemplateService.get_graph_json();
                        var ntjson = NodeTemplateService.get_graph_node_types();

                        var color = d3.scale.category10();


                        element.children().remove();
                        element.append("<div id=\"gpOverview" + contentAt + "\" class=\"model-overview\"></div>");

                        // setup svg div
                        var svg = d3.select("#gpOverview" + contentAt).append("svg")
                            .attr("width", width).attr("height", height)
                            .attr("pointer-events", "all");

                        // force layout setup
                        var force = d3.layout.force()
                            .charge(-350).linkDistance(125).size([width, height]);

                        //force.gravity(0.025);

                        force.nodes(gjson.nodes);
                        force.links(gjson.edges);
                        force.start();

                        // render relationships as lines
                        var link = svg.selectAll(".link")
                            .data(gjson.edges).enter()
                            .append("line").attr("class", function(d) {
                            return "link " + d.caption
                        })
                            .style("stroke-width", 6)
                            .on("mouseover", function() {
                            d3.select(this).style("stroke", "#999999").attr("stroke-opacity", "1.0");
                        })
                            .on("mouseout", function() {
                            d3.select(this).style("stroke", function(d) {
                                if (d.color !== null) {
                                    return d.color;
                                };
                            })
                                .attr("stroke-opacity", 0.5)
                        });

                        // render nodes as circles, css-class from label
                        var node = svg.selectAll(".node")
                            .data(gjson.nodes).enter()
                            .append("g")
                            .attr("class", function(d) {
                            return "node node-type-" + d.type_id
                        });

                        node.append("circle")
                            .style("fill", function(d) {
                            return color(d.type_id);
                        })
                            .attr("r", 20);
                        //                        .call(force.drag);

                        link.append("title").text(function(d) {
                            return d.caption;
                        });

                        node.append("text")
                            .attr("x", 3.5)
                            .attr("y", 3.5)
                            .attr("class", "shadow")
                            .text(function(d) {
                            return d.caption;
                        });

                        node.append("text")
                            .attr("x", 3.5)
                            .attr("y", 3.5)
                            .attr("fill", "black")
                            .text(function(d) {
                            return d.caption;
                        });


                        // html title attribute for title node-attribute
                        node.append("title")
                            .text(function(d) {
                            return d.caption + ' (' + d.type + ')';
                        });

                        node.call(force.drag);

                        // force feed algo ticks for coordinate computation
                        force.on("tick", function() {
                            link.attr("x1", function(d) {
                                return d.source.x;
                            })
                                .attr("y1", function(d) {
                                return d.source.y;
                            })
                                .attr("x2", function(d) {
                                return d.target.x;
                            })
                                .attr("y2", function(d) {
                                return d.target.y;
                            });

                            // node.attr("cx", function(d) { return d.x; })
                            //         .attr("cy", function(d) { return d.y; })
                            node.attr("transform", function(d) {
                                return "translate(" + [d.x, d.y] + ")";
                            });
                        });

                    }

                });
            }
        };
    }]);
})();
