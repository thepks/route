(function() {
    var app = angular.module('traceAnalyser', ["MessageLogService", "messageLog","FileReaderService", "fileReader", "TraceAnalysisService","BroadcastService","nodeVisualisation"]);

    var flatten = function(itemobj, threshold, parent) {
      var rows = [];
      var new_row = [];
      
      if (itemobj.name !== parent) {
          new_row = [itemobj.name, parent, itemobj.net, itemobj.item];
          rows.push(new_row);
//          console.log(new_row);
      }
      parent = itemobj.name;
      
      if ('children' in itemobj) {
          for (var j=0; j<itemobj.children.length; j++) {
//              if (itemobj.children[j].net > threshold ) {
//              console.log([itemobj.children[j].name, parent, itemobj.children[j].gross, itemobj.children[j].item]);
//                rows.push([itemobj.children[j].name, parent, itemobj.children[j].net, itemobj.children[j].item]);
//              }
//              if ('children' in itemobj.children[j]) {
                  var rows_ret = flatten(itemobj.children[j],threshold,parent);
                  for (var k=0; k<rows_ret.length; k++) {
                      rows.push(rows_ret[k]);
                  }
  //            } /*else {
//                rows.push([item.children[j].name, parent, item.children[j].gross]);
  //            }*/
          }
          
      }
      return rows;
      
    };


    app.controller('analysisController', ["MessageLogService", "TraceAnalysisService", "BroadcastService", function(MessageLogService, TraceAnalysisService, BroadcastService) {
        
        this.result ='';
        this.threshold = 0;
        this.reduction = 1000;
    this.measurement = '';
    this.measurements = [];
        this.tree = [];
        this.ready = false;
        

    this.get_measurements = function() {
        return this.measurements;
    };

    this.is_ready = function() {
         if (this.measurement.length > 0) {
        this.ready = true;
         }
         return this.ready;
    };


    this.is_file_read = function() {
         return this.result.length > 0;
    };

    this.is_parsed = function() {
        return this.measurements.length > 0;
    };
       


    this.display_result = function() {

        var v = this.measurement.split (/ /);


        BroadcastService.broadcast("gp-measurement",v[0]);
        BroadcastService.broadcast("gp-display-nodes",this.tree);

    };

        this.getStackData = function() {
        var measures;
        this.measurements = [];
        this.ready = false;
            this.tree = TraceAnalysisService.parse(this.result, this.threshold, this.reduction);
//            console.log(JSON.stringify(this.tree));
//            this.new_result = JSON.stringify(this.tree);
            
            console.log("Tree got");
            
        measures = this.tree.length;
        
        for (var i=0; i<measures; i++) {
        this.measurements.push(i + " - " + this.tree[i].name);
        }
    
            
//             var data_rows = [];
//             var new_rows = [];
//             var new_rows2 = [];
//             var new_keys = {};
//             data_rows.push(['Item', 'Parent', 'Gross']);
// //            data_rows.push([this.tree[0].name, '', this.tree[0].net,this.tree[0].item ]);
//             var item = {};
//             var new_row = [];
//             var curr_row = {};
//             var test_obj = [];


//             for (var i = 0; i < this.tree.length; i++) {
//                 new_rows = flatten(this.tree[i],this.threshold, '');
//                 for (var j=0; j< new_rows.length; j++) {
// //                    console.log('Pushing ' + JSON.stringify(new_rows[j]));
//                     data_rows.push(new_rows[j]);
//                 }
//             }
            
//             console.log("Flattened");
//             new_rows = [];
            
// //            console.log(JSON.stringify(data_rows));
            
//             // now dedup, later item parents are containers

//             new_rows.push(['Item', 'Parent', 'Gross']);
//             for (var k=1;k<data_rows.length; k++) {
//                 test_obj = data_rows[k];
// //                console.log(test_obj);
//                 if (!(test_obj[0] in new_keys)) {
//                     new_rows.push(test_obj);
// //                    console.log('Adding' + test_obj[0]);
//                     new_keys[test_obj[0]] = [test_obj[1],new_rows.length-1];  // parent and position in new_rows
//                 } else if( test_obj[1] >= new_keys[test_obj[0]][0]) { // parent is after current position
//                     var val = new_keys[test_obj[0]][1];
//                     new_rows[val] = test_obj;
//                     new_keys[test_obj[0]][0] = test_obj[1];
// //                    console.log('Replacing '+ test_obj[0][0]);
                    
//                 } else{
// //                    console.log('Preserving '+ new_keys[test_obj[0]][0] + ' ' + test_obj[1] );
//                 }
//             }
            
            
//             console.log("Deduped");
//             // strip attribut 3
//             new_rows2 = new_rows.map(function(item) {
//               return [item[0], item[1], item[2]]; 
//             });
            
//             console.log("Stripped");
// //            this.new_result = JSON.stringify(new_rows2);

// //            console.log(JSON.stringify(new_rows2));

//             var data = google.visualization.arrayToDataTable(new_rows2, false);

//             console.log("Google Table formed");
            
//             var treemap = new google.visualization.TreeMap(document.getElementById('chart_div'));
    
//             treemap.draw(data, {
//               minColor: '#0f0',
//               midColor: '#bbb',
//               maxColor: '#f00',
//               headerHeight: 25,
//               fontColor: 'black',
//               showScale: true,
//               maxDepth: 5,
//               maxPostDepth: 3,
//               generateTooltip: showFullTooltip
//             });


//             function showFullTooltip(row, size, value) {
//                 return '<div style="background:#fd9; padding:10px; border-style:solid">' +
//                 '<span style="font-family:Courier"><b>' + data.getValue(row, 0) +
//                 '</b>, ' + size +
//                 '</span></div>';
//             }

        };
        

    }]);




})();
