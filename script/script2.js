var margin = {t:50,l:50,b:50,r:50},
    width = document.getElementById('map').clientWidth-margin.l-margin.r,
    height = document.getElementById('map').clientHeight-margin.t-margin.b;

var map2 = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

//Set up projection and geo path generator

var scaleX = d3.scale.linear().domain([0,90]).range([0,width]),
    scaleY = d3.scale.linear().domain([30000,70000]).range([height,0]),
    scaleR2 = d3.scale.linear().domain([100000,7000000]).range([5,80]);
    scaleColor = d3.scale.linear().domain([15,35]).range(['white','#81C219']);

var axisX = d3.svg.axis()
    .orient('bottom')
    .tickSize(-height,0)
    .scale(scaleX);
var axisY = d3.svg.axis()
    .orient('left')
    .tickSize(-width,0)
    .scale(scaleY);

queue()
    .defer(d3.csv, "data/parkIncOb.csv", parse)
    .await(function(err,parkIncOb){

        map2.append('g')
            .attr('class','axis')
            .attr('transform','translate(0,'+height+')')
            .call(axisX);
        map2.append('g')
            .attr('class','axis')
            .call(axisY);

        // console.log(parkIncOb);

        var nodes = map2.selectAll('.state')
            .data(parkIncOb, function(d){return d.state})
            .enter()
            .append('g')
            .attr('class','state')
            .call(attachTooltip);

        nodes
            .append('circle')
            .attr('transform', function(d){
                return 'translate('+scaleX(d.pctPark)+','+scaleY(d.income)+')';
            })
            .attr('r', function(d){
                return scaleR2(d.popObese);
            })
            .style('fill', function(d){
                return scaleColor(d.pctObese)
            })

         
        function attachTooltip(selection){
        selection
            .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            
            tooltip
                .transition()
                .style('opacity',1);
           
            tooltip.select('#name').html(d.name);
            tooltip.select('#obese').html(d.pctObese);
            tooltip.select('#park').html(d.pctPark); 
            tooltip.select('#income').html(d.income); 
            })

            .on('mousemove',function(){
            var xy = d3.mouse(map2.node());
            
            var tooltip = d3.select('.custom-tooltip');
            
            tooltip
                .style('left',(d3.event.pageX+"px"))
                .style('top',(d3.event.pageY+"px"))
            })

            .on('mouseleave',function(){
            d3.select('.custom-tooltip')
                .transition()
                .style('opacity',0);
            }) 
        }  
    })





//import data
// queue()
// 	.defer(d3.json, "data/states.json")
//     .defer(d3.csv, "data/obese.csv", parseData)
// 	.await(function(err, states, obesity){ 

//         var maxOb = d3.max(obesity);
//         scaleR.domain([0,maxOb.popObese]);

//         console.log(maxOb.popObese);

//         //construct a new array of data
//         var data = states.features.map(function(d){
//             var centroid = path.centroid(d);

//             return {
//                 stateName:d.properties.NAME,
//                 state:d.properties.STATE,
//                 x0:centroid[0],
//                 y0:centroid[1],
//                 x:centroid[0],
//                 y:centroid[1],
//                 //r:scaleR((obByState.get(d.properties.STATE).obesity))
//             }
//         });
        
//         console.log(data);

// 		var nodes = map.selectAll('.state')
//             .data(data, function(d){return d.state})
//             .enter()
//             .append('g')
//             .attr('class','state');
//         nodes
//             .append('circle')
//             .attr('r',function(d){
//                 var obese = NEED TO ACCESS POPOBESE

//                 return scaleR(obese);
//             })
//             .style('fill',function(d){
//                 var pctOb = (obByState.get(d.state)).pctObese;
//                 return scaleColor(pctOb);
//             })
//             .style('fill-opacity',.7);
//         nodes
//             .append('text')
//             .text(function(d){
//                 return d.stateName;
//             })
//             .attr('text-anchor','middle')
//             .attr('transform','translate('+0+','+4+')');

//         //TODO: create a force layout
//         //with what physical parameters?
//         var force = d3.layout.force()
//             .size([width,height])
//             .charge(-40)
//             .gravity(.01);

//         force.nodes(data)
//             .on('tick', onForceTick)
//             .start();

//         function onForceTick(e){
//             var q = d3.geom.quadtree(data),
//                 i = 0,
//                 n = data.length;

//             while( ++i<n ){
//                 q.visit(collide(data[i]));
//             }

//             nodes
//                 .each(gravity(e.alpha*.05))
//                 .attr('transform',function(d){
//                         return 'translate('+d.x+','+d.y+')';
//                     })

//             function gravity(k){
//                 return function(d){
//                     d.y += (d.y0 - d.y)*k;
//                     d.x += (d.x0 - d.x)*k;
//                 }
//             }

//             function collide(dataPoint){
//                 var nr = dataPoint.r + 5,
//                     nx1 = dataPoint.x - nr,
//                     ny1 = dataPoint.y - nr,
//                     nx2 = dataPoint.x + nr,
//                     ny2 = dataPoint.y + nr;

//                 return function(quadPoint,x1,y1,x2,y2){
//                     if(quadPoint.point && (quadPoint.point !== dataPoint)){
//                         var x = dataPoint.x - quadPoint.point.x,
//                             y = dataPoint.y - quadPoint.point.y,
//                             l = Math.sqrt(x*x+y*y),
//                             r = nr + quadPoint.point.r;
//                         if(l<r){
//                             l = (l-r)/l*.1;
//                             dataPoint.x -= x*= (l*.05);
//                             dataPoint.y -= y*= l;
//                             quadPoint.point.x += (x*.05);
//                             quadPoint.point.y += y;
//                         }
//                     }
//                     return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;
//                 }
//             }
//         }
// 	});



function parse(d){
    //Use the parse function to populate the lookup table of states and their populations/% pop 18+

    return {
        name: d.NAME,
        state: d.STATE,
        pctPark: +d.pctPark,
        income: +d.income,
        popObese: +d.popObese,
        pctObese: +d.pctObese
    };
}

// function parseData(d){
//     //Use the parse function to populate the lookup table of states and their populations/% pop 18+

//     obByState.set(d.STATE,{
//         'name': d.NAME,
//         'state': d.STATE,
//         popObese:+d.popObese,
//         pctObese:+d.pctObese
//     });

//     return {
//         'name': d.NAME,
//         'state': d.STATE,
//         popObese:+d.popObese,
//         pctObese:+d.pctObese
//     }
// }
