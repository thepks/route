(function() {

    var app = angular.module('NodeTemplateService', []);

    var username;
    var password;
    var model = {};
    var prototypes = {};

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

    app.factory("NodeTemplateService", ["$q", "$http", function($q, $http) {



        return {

            authorize: function(user, pass) {

                var userobj = {};
                userobj.user = {};
                userobj.user.username = user;
                userobj.user.password = pass;

                username = user;
                password = pass;

                model = {};
                model.nodes = {};
                model.instanceRelationships = [];
                model.prototypeValue = {};
                model.joins = [];

                prototypes.types = [];



                return $http.post("/action/logon", userobj);

            },

            logoff: function() {

                return $http.post("/action/logoff");
            },

            new_model: function() {
                model = {};
                model.nodes = {};
                model.instanceRelationships = [];
                model.prototypeValue = {};
                model.joins = [];
            },

            get_node_types: function() {
                return model.nodes;
            },

            get_node_type_list: function() {
                return Object.keys(model.nodes);
            },

            delete_node_type: function(name) {
                var deltaRecord = {};
                var found = false;
                var node = model.nodes[name];

                for (var i = 0; i < node.length; i++) {
                    if (node[i] && node[i].constructor === Object) {
                        deltaRecord = node[i];
                        if ('model' in deltaRecord && deltaRecord.model === 'existing') {
                            deltaRecord.mod = 'delete';
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    delete(model.nodes[name]);
                }
            },

            undo_delete_existing_node_type: function(name) {

                var deltaRecord = {};
                var node = model.nodes[name];

                for (var i = 0; i < node.length; i++) {
                    if (node[i] && node[i].constructor === Object) {
                        deltaRecord = node[i];
                        if ('model' in deltaRecord && deltaRecord.model === 'existing' && 'mod' in deltaRecord && deltaRecord.mod === 'delete') {
                            delete(deltaRecord.mod);
                            break;
                        }
                    }
                }

            },

            is_node_flagged_for_deletion: function(name) {

                var deltaRecord = {};
                var node = model.nodes[name];

                for (var i = 0; i < node.length; i++) {
                    if (node[i] && node[i].constructor === Object) {
                        deltaRecord = node[i];
                        if ('model' in deltaRecord && deltaRecord.model === 'existing' && 'mod' in deltaRecord && deltaRecord.mod === 'delete') {
                            return true;
                        }
                    }
                }

                return false;
            },

            get_node_type_attributes: function(name) {

                var node = model.nodes[name];
                var togo = [];
                if (node) {
                    togo = node.filter(function(item) {
                        return item && item.constructor !== Object;
                    });
                }

                return togo;

            },

            add_node_type: function(obj) {

                var attr_provided = [];

                var deltaRecord = {};
                deltaRecord.mod = 'add';

                if (obj.name) {
                    model.nodes[obj.name] = [];
                    model.nodes[obj.name].push(deltaRecord);
                    model.nodes[obj.name].push('name');

                    try {
                        attr_provided = obj.attributeList.split(' ');
                        for (var i = 0; i < attr_provided.length; i++) {
                            model.nodes[obj.name].push(attr_provided[i]);
                        }
                    } catch (e) {}

                    model.prototypeValue[obj.name] = [];

                }
            },

            get_prototype_joins: function() {
                return model.joins;
            },

            add_prototype_join: function(obj) {

                if ('leftNode' in obj && 'rightNode' in obj) {
                    obj.deltaRecord = {};
                    obj.deltaRecord.mod = 'add';
                    model.joins.push(obj);
                }
            },

            get_prototype_join_value: function(leftObj, rightObj) {
                for (var i = 0; i < model.joins.length; i++) {
                    if (model.joins[i].leftNode === leftObj && model.joins[i].rightNode === rightObj) {
                        return model.joins[i].join;
                    }
                }
            },

            delete_prototype_join_value: function(obj) {
                if (obj && 'deltaRecord' in obj && 'model' in obj.deltaRecord && obj.deltaRecord.model === 'existing') {
                    obj.deltaRecord.mod = 'delete';
                    return;
                }

                for (var i = 0; i < model.joins.length; i++) {
                    if (model.joins[i] && model.joins[i].leftNode === obj.leftNode && model.joins[i].rightNode === obj.rightNode) {
                        delete(model.joins[i]);
                    }
                }

                model.joins = array_prune(model.joins);
            },

            get_model_data: function() {
                return prototypes;
            },

            load_model_data: function() {

                var that = this;

                var deferred = $q.defer();

                this.get_prototype_object_list('Process')
                    .success(function(data) {

                    for (var i = 0; i < data.results[0].data.length; i++) {
                        prototypes.types.push(data.results[0].data[i].row[0][0]);
                        prototypes[data.results[0].data[i].row[0][0]] = [];
                    }


                    for (var i = 0; i < data.results[1].data.length; i++) {
                        var t = data.results[1].data[i].row[0][0];
                        prototypes[t].push(data.results[1].data[i].row[1]);
                    }

                    deferred.resolve();

                }).
                error(function() {
                    console.log('Error in loading model');
                    deferred.reject();
                });


                return deferred.promise;


            },


            get_prototype_object_list: function() {

                var cmd = "{ \"statements\": [ \
                    { \"statement\": \"match(n) return distinct labels(n);\"}, \
                    { \"statement\": \"match (u) return labels(u), u.name;\"} ] }";
                var url = '/db/data/transaction/commit';

                var req = {
                    method: 'POST',
                    url: url,
                    data: cmd,
                };

                return $http(req);

            },

            get_prototype_list: function(nodetype) {

                return model.prototypeValue[nodetype];

            },

            add_prototype_object: function(nodetype, obj) {
                var toadd = {};
                var keyvals = Object.keys(obj);

                for (var i = 0; i < keyvals.length; i++) {
                    toadd[keyvals[i]] = obj[keyvals[i]];
                }

                toadd.deltaRecord = {};
                toadd.deltaRecord.mod = 'add';

                model.prototypeValue[nodetype].push(toadd);
            },

            delete_prototype_object: function(obj) {
                var keys = Object.keys(model.prototypeValue);
                var obj2 = {};
                var tmp = [];

                if (obj && 'deltaRecord' in obj) {
                    obj.deltaRecord.mod = 'delete';
                }

                for (var i = 0; i < keys.length; i++) {
                    for (var j = 0; j < model.prototypeValue[keys[i]].length; j++) {
                        obj2 = model.prototypeValue[keys[i]][j];
                        if (obj2 && 'deltaRecord' in obj2 && 'mod' in obj2.deltaRecord && obj2.deltaRecord.mod === 'delete' && !('model' in obj2.deltaRecord)) {
                            delete(model.prototypeValue[keys[i]][j]);
                        }
                    }

                    model.prototypeValue[keys[i]] = array_prune(model.prototypeValue[keys[i]]);

                }
            },

            add_instance_relationship: function(leftNode, leftObj, rightNode, rightObj) {
                var join;
                var toAdd = {};

                for (var i = 0; i < model.joins.length; i++) {
                    if (model.joins[i].leftNode === leftNode && model.joins[i].rightNode === rightNode) {
                        join = model.joins[i].join;
                    }
                }

                toAdd.leftObj = leftObj;
                toAdd.leftNodeType = leftNode;
                toAdd.rightObj = rightObj;
                toAdd.rightNodeType = rightNode;
                toAdd.join = join;

                toAdd.deltaRecord = {};
                toAdd.deltaRecord.mod = 'add';

                model.instanceRelationships.push(toAdd);

            },

            get_instance_relationship_list: function() {
                return model.instanceRelationships;
            },

            delete_instance_relationship: function(obj) {
                var obj2;

                if (obj && 'deltaRecord' in obj) {
                    obj.deltaRecord.mod = 'delete';
                }

                for (var i = 0; i < model.instanceRelationships.length; i++) {
                    obj2 = model.instanceRelationships[i];
                    if (obj2 && 'deltaRecord' in obj2 && 'mod' in obj2.deltaRecord && obj2.deltaRecord.mod === 'delete' && !('model' in obj2.deltaRecord)) {
                        delete(model.instanceRelationships[i]);
                    }
                }

                model.instanceRelationships = array_prune(model.instanceRelationships);

            },

            undo_delete_item: function(obj) {
                if (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'delete') {
                    delete(obj.deltaRecord.mod);
                }
            },

            is_item_deleted: function(obj) {
                return (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'delete');
            },

            clean_attribute_object_for_prototype: function(item) {

                var keys = Object.keys(item);
                var togo = {};

                for (var i = 0; i < keys.length; i++) {
                    if (item[keys[i]] && item[keys[i]].constructor !== Object) {
                        togo[keys[i]] = item[keys[i]];
                    }
                }

                return togo;

            },

            load_full_model_to_template: function() {

                var deferred = $q.defer();

                var cmd = "{ \"statements\": [ \
                    { \"statement\": \"match(n) return distinct labels(n);\"}, \
                    { \"statement\": \"MATCH (a)-[r]->(b) WHERE labels(a) <> [] AND labels(b) <> [] RETURN DISTINCT head(labels(a)) AS This, type(r) as To, head(labels(b)) AS That;\"}, \
                    { \"statement\": \"match (n)-[r]->(m) where labels(n) <> \\\"User\\\" return distinct labels(n),n,type(r),labels(m),m, ID(n), ID(m);\"} \
                    ] \
                }";


                this.load_model_to_template(cmd)
                    .then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(data);
                });


                return deferred.promise;
            },

            load_old_analysis_results_to_template: function(objectType, objectValue, depth) {

                var deferred = $q.defer();

                var objs = "n:Server or n:Application or n:Database or n:Service";
                if (objectType !== 'Process') {
                    objs += " or n:Process";
                }

                // match (u:Process)-[*1..2]-(n) where u.name='sales' and (n:Server or n:Application or n:Database or n:Service)  return u,n;                

                var cmd = "{ \"statements\": [ \
                    { \"statement\": \"match(n) return distinct labels(n);\"}, \
                    { \"statement\": \"MATCH (a)-[r]->(b) WHERE labels(a) <> [] AND labels(b) <> [] RETURN DISTINCT head(labels(a)) AS This, type(r) as To, head(labels(b)) AS That;\"}, \
                    { \"statement\": \"match (u:" + objectType + ")-[r*1.." + depth + "]-(n) where u.name=\\\"" + objectValue + "\\\" and (" + objs + ") return distinct labels(u),u,extract (p in r | type(p)) as rels,labels(n),n, ID(u), ID(n);\"} \
                    ] \
                }";


                this.load_model_to_template(cmd)
                    .then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            },


            load_analysis_results_to_template: function(objectType, objectValue, depth) {

                var deferred = $q.defer();

                var objs = "n:Server or n:Application or n:Database or n:Service";
                if (objectType !== 'Process') {
                    objs += " or n:Process";
                }

                // match (u:Process)-[*1..2]-(n) where u.name='sales' and (n:Server or n:Application or n:Database or n:Service)  return u,n;                

                var cmd = "{ \"statements\": [ \
                    { \"statement\": \"match(n) return distinct labels(n);\"}, \
                    { \"statement\": \"MATCH (a)-[r]->(b) WHERE labels(a) <> [] AND labels(b) <> [] RETURN DISTINCT head(labels(a)) AS This, type(r) as To, head(labels(b)) AS That;\"}, \
                    { \"statement\": \"match p=(u:" + objectType + ")-[r*1.." + depth + "]-(n) where u.name=\\\"" + objectValue + "\\\" and (" + objs + ") return extract(a in nodes(p) | labels(a)) as nodeType, extract (b in nodes(p) | b.name) as nodeName, extract (c in relationships(p) | type(c)) as Joins, extract (d in nodes(p) | d) as nodeValues, extract (e in nodes(p) | ID(e)) as nodeID;\"} \
                    ] \
                }";

                var url = '/db/data/transaction/commit';

                var req = {
                    method: 'POST',
                    url: url,
                    data: cmd,
                };

                $http(req)
                    .then(function(a) {
                    model = {};
                    model.nodes = {};
                    model.instanceRelationships = [];
                    model.prototypeValue = {};
                    model.joins = [];
                    var deltaRecord = {};
                    deltaRecord.model = 'existing';
                    var data = a.data;

                    // results is the structure containing the response
                    // results[0] is the node object;

                    for (var i = 0; i < data.results[0].data.length; i++) {
                        model.nodes[data.results[0].data[i].row[0][0]] = [];
                        deltaRecord = {};
                        deltaRecord.model = 'existing';
                        model.nodes[data.results[0].data[i].row[0][0]].push(deltaRecord);
                        model.nodes[data.results[0].data[i].row[0][0]].push('name');
                    }

                    // results [1] are the fundamental relationships, but [2] also describes

                    for (i = 0; i < data.results[1].data.length; i++) {
                        var newRelationship = {};
                        newRelationship.leftNode = data.results[1].data[i].row[0];
                        newRelationship.join = data.results[1].data[i].row[1];
                        newRelationship.rightNode = data.results[1].data[i].row[2];
                        newRelationship.deltaRecord = {};
                        newRelationship.deltaRecord.model = 'existing';
                        model.joins.push(newRelationship);
                    }

                    for (i = 0; i < data.results[2].data.length; i++) {
                        var row = data.results[2].data[i].row;
                        var nodeTypes = row[0];
                        var nodeNames = row[1];
                        var nodeJoins = row[2];
                        var nodeValues = row[3];
                        var nodeIDs = row[4];

                        var path_objects = nodeTypes.length - 1;
                        for (var j = 0; j < path_objects; j++) {
                            var node = nodeTypes[j][0];
                            var node_value = nodeValues[j];
                            var node_label = nodeNames[j];
                            var nodeID = nodeIDs[j];
                            var node_join = nodeJoins[j];
                            var partner_node = nodeTypes[j + 1][0];
                            var partner_node_label = nodeNames[j + 1];
                            var partner_node_value = nodeValues[j + 1];
                            var partnerID = nodeIDs[j + 1];

                            if ('$$hashKey' in node_value) {
                                delete node_value['$$hashKey'];
                            }

                            if ('$$hashKey' in partner_node_value) {
                                delete partner_node_value['$$hashKey'];
                            }

                            node_value.ID = nodeID;
                            partner_node_value.ID = partnerID;

                            var currProps = model.nodes[node];
                            var keyvals = Object.keys(node_value);
                            for (var k = 0; k < keyvals.length; k++) {
                                if (currProps.indexOf(keyvals[k]) < 0) {
                                    model.nodes[node].push(keyvals[k]);
                                }
                            }

                            currProps = model.nodes[partner_node];
                            keyvals = Object.keys(partner_node_value);
                            for (k = 0; k < keyvals.length; k++) {
                                if (currProps.indexOf(keyvals[k]) < 0) {
                                    model.nodes[partner_node].push(keyvals[k]);
                                }
                            }


                            var toAdd = {};
                            var prototypes = [];
                            var found = false;

                            toAdd.leftObj = node_value;
                            toAdd.leftNodeType = node;
                            toAdd.rightObj = partner_node_value;
                            toAdd.rightNodeType = partner_node;
                            toAdd.join = node_join;
                            toAdd.deltaRecord = {};
                            toAdd.deltaRecord.model = 'existing';

                            model.instanceRelationships.push(toAdd);

                            if (node in model.prototypeValue) {
                                prototypes = model.prototypeValue[node];
                                for (k = 0; k < prototypes.length; k++) {
                                    if (prototypes[k].name === node_label) {
                                        found = true;
                                        break;
                                    }
                                }
                            } else {
                                model.prototypeValue[node] = [];
                            }

                            if (!found) {

                                node_value.deltaRecord = {};
                                node_value.deltaRecord.model = 'existing';

                                model.prototypeValue[node].push(node_value);
                            }

                            found = false;

                            if (partner_node in model.prototypeValue) {
                                prototypes = model.prototypeValue[partner_node];
                                for (k = 0; k < prototypes.length; k++) {
                                    if (prototypes[k].name === partner_node_label) {
                                        found = true;
                                        break;
                                    }
                                }
                            } else {
                                model.prototypeValue[partner_node] = [];
                            }

                            if (!found) {

                                partner_node_value.deltaRecord = {};
                                partner_node_value.deltaRecord.model = 'existing';

                                model.prototypeValue[partner_node].push(partner_node_value);
                            }

                        }


                    }

                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(data);
                });

                return deferred.promise;
            },


            load_model_to_template: function(cmd) {

                var deferred = $q.defer();
                var url = '/db/data/transaction/commit';

                var req = {
                    method: 'POST',
                    url: url,
                    data: cmd,
                };

                $http(req).
                success(function(data) {

                    model = {};
                    model.nodes = {};
                    model.instanceRelationships = [];
                    model.prototypeValue = {};
                    model.joins = [];
                    var deltaRecord = {};
                    deltaRecord.model = 'existing';

                    // results is the structure containing the response
                    // results[0] is the node object;

                    for (var i = 0; i < data.results[0].data.length; i++) {
                        model.nodes[data.results[0].data[i].row[0][0]] = [];
                        deltaRecord = {};
                        deltaRecord.model = 'existing';
                        model.nodes[data.results[0].data[i].row[0][0]].push(deltaRecord);
                        model.nodes[data.results[0].data[i].row[0][0]].push('name');
                    }

                    // results [1] are the fundamental relationships, but [2] also describes

                    for (i = 0; i < data.results[1].data.length; i++) {
                        var newRelationship = {};
                        newRelationship.leftNode = data.results[1].data[i].row[0];
                        newRelationship.join = data.results[1].data[i].row[1];
                        newRelationship.rightNode = data.results[1].data[i].row[2];
                        newRelationship.deltaRecord = {};
                        newRelationship.deltaRecord.model = 'existing';
                        model.joins.push(newRelationship);
                    }

                    // results [3] gives prototypes and relationships
                    // First populate out the node descriptions
                    for (i = 0; i < data.results[2].data.length; i++) {
                        var node1 = data.results[2].data[i].row[0][0];
                        var properties1 = data.results[2].data[i].row[1];
                        properties1.ID = data.results[2].data[i].row[5];

                        if ('$$hashKey' in properties1) {
                            delete properties1['$$hashKey'];
                        }

                        var currProps = model.nodes[node1];
                        var keyvals = Object.keys(properties1);
                        for (var j = 0; j < keyvals.length; j++) {
                            if (currProps.indexOf(keyvals[j]) < 0) {
                                model.nodes[node1].push(keyvals[j]);
                            }
                        }

                        var node2 = data.results[2].data[i].row[3][0];
                        var properties2 = data.results[2].data[i].row[4];
                        properties2.ID = data.results[2].data[i].row[6];

                        if ('$$hashKey' in properties2) {
                            delete properties2['$$hashKey'];
                        }

                        currProps = model.nodes[node2];
                        keyvals = Object.keys(properties2);
                        for (j = 0; j < keyvals.length; j++) {
                            if (currProps.indexOf(keyvals[j]) < 0) {
                                model.nodes[node2].push(keyvals[j]);
                            }
                        }
                    }

                    // Now populate out the instances

                    for (i = 0; i < data.results[2].data.length; i++) {

                        // The type is the hash, key 0 and key 3
                        // The properties are in key 1 and key 4

                        var leftNode = data.results[2].data[i].row[0][0];
                        var rightNode = data.results[2].data[i].row[3][0];
                        var join = data.results[2].data[i].row[2];
                        var toAdd = {};
                        var leftObj = data.results[2].data[i].row[1];
                        var rightObj = data.results[2].data[i].row[4];
                        var prototypes = [];
                        var found = false;

                        if ('$$hashKey' in leftObj) {
                            delete leftObj['$$hashKey'];
                        }

                        if ('$$hashKey' in rightObj) {
                            delete rightObj['$$hashKey'];
                        }



                        toAdd.leftObj = leftObj;
                        toAdd.leftNodeType = leftNode;
                        toAdd.rightObj = rightObj;
                        toAdd.rightNodeType = rightNode;
                        toAdd.join = join;
                        toAdd.deltaRecord = {};
                        toAdd.deltaRecord.model = 'existing';

                        model.instanceRelationships.push(toAdd);

                        if (leftNode in model.prototypeValue) {
                            prototypes = model.prototypeValue[leftNode];
                            for (var k = 0; k < prototypes.length; k++) {
                                if (prototypes[k].name === leftObj.name) {
                                    found = true;
                                    break;
                                }
                            }
                        } else {
                            model.prototypeValue[leftNode] = [];
                        }

                        if (!found) {

                            leftObj.deltaRecord = {};
                            leftObj.deltaRecord.model = 'existing';

                            model.prototypeValue[leftNode].push(leftObj);
                        }

                        found = false;

                        if (rightNode in model.prototypeValue) {
                            prototypes = model.prototypeValue[rightNode];
                            for (var l = 0; l < prototypes.length; l++) {
                                if (prototypes[l].name === rightObj.name) {
                                    found = true;
                                    break;
                                }
                            }
                        } else {
                            model.prototypeValue[rightNode] = [];
                        }

                        if (!found) {

                            rightObj.deltaRecord = {};
                            rightObj.deltaRecord.model = 'existing';

                            model.prototypeValue[rightNode].push(rightObj);
                        }

                    }

                    console.log(JSON.stringify(model));
                    deferred.resolve(model);
                }).
                error(function() {
                    console.log('Error in loading model');
                    deferred.reject();
                });

                return deferred.promise;

            },

            get_graph_node_types: function() {

                var nodeTypeKeys = Object.keys(model.nodes);
                var obj = {};
                obj.type = nodeTypeKeys;

                return obj;
            },


            get_graph_json: function() {

                var togo = {};
                var node = {};
                var obj = {};

                var proto_keys = Object.keys(model.prototypeValue);
                var join_list = model.instanceRelationships;
                var nodeTypeKeys = Object.keys(model.nodes);

                var nodeTypeRef = {};

                for (var h = 0; h < nodeTypeKeys.length; h++) {
                    nodeTypeRef[nodeTypeKeys[h]] = h;
                }

                togo.nodes = [];
                togo.edges = [];

                // Now thats great but for d3 we need zero offset ids
                var objid = 0;
                var crossref = {};

                // First create nodes     
                for (var i = 0; i < proto_keys.length; i++) {
                    for (var j = 0; j < model.prototypeValue[proto_keys[i]].length; j++) {
                        obj = {};
                        node = model.prototypeValue[proto_keys[i]][j];
                        obj.type = proto_keys[i];
                        obj.type_id = nodeTypeRef[obj.type];
                        obj.caption = node.name.replace(/ /g, "_");
                        obj.name = node.name.replace(/ /g, "_");
                        obj.label = obj.type;
                        obj.graphid = node.ID;
                        if ('ID' in node && obj.type !== 'User' && obj.type !== 'Role') {
                            obj.id = objid;
                            togo.nodes.push(obj);
                            crossref[obj.graphid] = obj.id;
                            objid++;
                        }
                    }
                }

                // Now the edges

                for (var l = 0; l < join_list.length; l++) {

                    // Were there any prototypes of these types

                    if ('ID' in join_list[l].leftObj && 'ID' in join_list[l].rightObj) {

                        if (join_list[l].leftNodeType !== 'User' && join_list[l].leftNodeType !== 'Role' && join_list[l].rightNodeType !== 'User' && join_list[l].rightNodeType !== 'Role') {

                            var obj1id = crossref[join_list[l].leftObj.ID];
                            var obj2id = crossref[join_list[l].rightObj.ID];
                            var join = join_list[l].join;
                            obj = {};
                            obj.source = obj1id;
                            obj.target = obj2id;
                            obj.caption = join;
                            obj.type = join;
                            obj.weight = 1;
                            if (typeof obj.source !== 'undefined' && typeof obj.target !== 'undefined') {
                                togo.edges.push(obj);
                            }
                        }
                    }
                }


                console.log(JSON.stringify(togo));
                return togo;


            },

            add_template_to_model: function() {

                var deferred = $q.defer();
                var url = '/db/data/transaction/commit';

                var proto_keys = Object.keys(model.prototypeValue);
                var join_list = model.instanceRelationships;
                var obj_keys = {};
                var obj_keys2;
                var cmd = '';
                var cmd2 = '';
                var cmd3 = '';
                var nodetype = '';
                var obj;
                var cmds = [];
                var k;
                var backout_model = model;


                // First create/delete nodes     
                for (var i = 0; i < proto_keys.length; i++) {
                    nodetype = proto_keys[i];
                    for (var j = 0; j < model.prototypeValue[proto_keys[i]].length; j++) {
                        // add object
                        obj = model.prototypeValue[proto_keys[i]][j];

                        if (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'add') {

                            delete(obj.deltaRecord);
                            obj_keys = Object.keys(obj);

                            cmd = 'CREATE (a:' + nodetype + ' {';
                            for (k = 0; k < obj_keys.length; k++) {
                                if (obj_keys[k] !== '$$hashKey') {
                                    cmd = cmd + obj_keys[k] + ": '" + obj[obj_keys[k]] + "',";
                                }
                            }

                            if (obj_keys.length > 0) {
                                // strip last ,
                                cmd = cmd.substring(0, cmd.length - 1);
                            }

                            cmd = cmd + "});";
                            cmds.push(cmd);

                        } else if (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'delete') {

                            try {
                                delete(obj.ID);
                            } catch (e) {}



                            delete(obj.deltaRecord);
                            obj_keys = Object.keys(obj);

                            cmd = 'MATCH (a:' + nodetype + ' {';
                            for (k = 0; k < obj_keys.length; k++) {
                                if (obj_keys[k] !== '$$hashKey') {
                                    cmd = cmd + obj_keys[k] + ": '" + obj[obj_keys[k]] + "',";
                                }
                            }

                            if (obj_keys.length > 0) {
                                // strip last ,
                                cmd = cmd.substring(0, cmd.length - 1);
                                cmd2 = cmd + "\"})-[r]-() delete r;";
                                cmd3 = cmd + "\"}) delete a;";
                            }

                            cmds.push(cmd2);
                            cmds.push(cmd3);
                        }

                    }
                }


                // Now add links  based on the relationships

                for (var l = 0; l < join_list.length; l++) {

                    // Were there any prototypes of these types
                    var obj1 = join_list[l].leftObj;
                    var obj1type = join_list[l].leftNodeType;
                    var obj2 = join_list[l].rightObj;
                    var obj2type = join_list[l].rightNodeType;
                    var join = join_list[l].join;
                    var obj = join_list[l];

                    if (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'add') {

                        try {
                            delete(obj1.ID);
                        } catch (e) {}

                        try {
                            delete(obj2.ID);
                        } catch (e) {}

                        delete(obj.deltaRecord);
                        try {
                            delete(obj1.deltaRecord);
                        } catch (e) {}

                        try {
                            delete(obj2.deltaRecord);
                        } catch (e) {}

                        // add object
                        cmd = 'MATCH (a:' + obj1type + '), (b:' + obj2type + ')';
                        var where_clause = 'WHERE ';

                        obj_keys = Object.keys(obj1);
                        for (var n = 0; n < obj_keys.length; n++) {
                            if (obj_keys[n] !== '$$hashKey') {
                                where_clause = where_clause + "a." + obj_keys[n] + "='" + obj1[obj_keys[n]] + "' AND ";
                            }
                        }


                        obj_keys2 = Object.keys(obj2);
                        for (var p = 0; p < obj_keys2.length; p++) {
                            if (obj_keys2[p] !== '$$hashKey') {
                                where_clause = where_clause + "b." + obj_keys2[p] + "='" + obj2[obj_keys2[p]] + "' AND ";
                            }
                        }

                        // strip last 
                        where_clause = where_clause.substring(0, where_clause.length - 4);

                        cmd = cmd + where_clause + " CREATE (a)-[:" + join.toUpperCase() + "]->(b);";
                        cmds.push(cmd);

                    } else if (obj && 'deltaRecord' in obj && 'mod' in obj.deltaRecord && obj.deltaRecord.mod === 'delete') {

                        try {
                            delete(obj1.ID);
                        } catch (e) {}

                        try {
                            delete(obj2.ID);
                        } catch (e) {}

                        delete(obj.deltaRecord);
                        try {
                            delete(obj1.deltaRecord);
                        } catch (e) {}

                        try {
                            delete(obj2.deltaRecord);
                        } catch (e) {}

                        cmd = 'MATCH (a:' + obj1type + ') -[r]- (b:' + obj2type + ')';
                        var where_clause = 'WHERE ';


                        obj_keys = Object.keys(obj1);
                        for (var n = 0; n < obj_keys.length; n++) {
                            if (obj_keys[n] !== '$$hashKey') {
                                where_clause = where_clause + "a." + obj_keys[n] + "='" + obj1[obj_keys[n]] + "' AND ";
                            }
                        }

                        if ('changes' in obj2) {
                            delete(obj2.changes);
                        }


                        obj_keys2 = Object.keys(obj2);
                        for (var p = 0; p < obj_keys2.length; p++) {
                            if (obj_keys2[p] !== '$$hashKey') {
                                where_clause = where_clause + "b." + obj_keys2[p] + "='" + obj2[obj_keys2[p]] + "' AND ";
                            }
                        }

                        // strip last 
                        where_clause = where_clause.substring(0, where_clause.length - 4);

                        cmd = cmd + where_clause + " DELETE r;";
                        cmds.push(cmd);

                    }
                }

                // delete free nodes
                cmds.push('MATCH (n) WHERE NOT n--() DELETE n;');

                cmd = "{ \"statements\": [";

                for (var z = 0; z < cmds.length; z++) {
                    cmd = cmd + "{ \"statement\": \"";
                    cmd = cmd + cmds[z];
                    cmd = cmd + "\"},";
                }

                cmd = cmd.substring(0, cmd.length - 1);
                cmd = cmd + "]}";

                console.log(cmd);


                var req = {
                    method: 'POST',
                    url: url,
                    data: cmd,
                };

                $http(req).
                success(function(data) {
                    deferred.resolve(data);
                }).
                error(function() {
                    console.log('Error in loading model');
                    model = backout_model;
                    deferred.reject();
                });

                return deferred.promise;

            }

        };
    }]);
})();