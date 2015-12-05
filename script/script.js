var margin = {t:50,l:50,b:50,r:50},
    width = document.getElementById('map').clientWidth-margin.l-margin.r,
    height = document.getElementById('map').clientHeight-margin.t-margin.b;

var map = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g').attr('class','map')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

//Set up projection and geo path generator
var projection = d3.geo.albersUsa()
	.translate([width/2, height/2]);

var path = d3.geo.path()
	.projection(projection);

var obByState = d3.map();

//Scales
var scaleR = d3.scale.linear().domain([100000,6300000]).range([8,80]),
    scaleColor = d3.scale.linear().domain([12,27]).range(['white','#B74077']);


//import data
queue()
	.defer(d3.json, "data/states.json")
    .defer(d3.csv, "data/parkIncOb.csv", parseData)
	.await(function(err, states, obesity){ 

        console.log(obByState);

        // var maxOb = d3.max(obesity);
        // scaleR.domain([0,maxOb.popObese]);

        //construct a new array of data
        var data = states.features.map(function(d){
            var centroid = path.centroid(d);

            //if a state is not in both data files, return nothing
            if(!obByState.get(+d.properties.STATE)){
            //    console.log(d.properties.STATE + " not found");
                return;
            }

            return {
                stateName:d.properties.NAME,
                state:+d.properties.STATE,
                x0:centroid[0],
                y0:centroid[1],
                x:centroid[0],
                y:centroid[1],
                r:scaleR((obByState.get(+d.properties.STATE).popObese))
            }
        });
        
        //filtering PR out of data
        data = data.filter(function(d){return d!=undefined});
        
		//enter exit update
        // map.selectAll('state')
        //     .data(states.features)
        //     .enter()
        //     .append('path')
        //     .attr('d',path)
        //     .attr('class','backMap');

        var nodes = map.selectAll('state')
            .data(data, function(d){return d.state})
            .enter()
            .append('g')
            .attr('class','state')
            .call(attachTooltip);
        nodes
            .append('circle')
            .attr('class','circle')
            .attr('r',function(d){
                var obese = (obByState.get(+d.state)).popObese;
                return scaleR(obese);
            })
            .style('fill',function(d){
                var pctOb = (obByState.get(+d.state)).pctObese;
                return scaleColor(pctOb);
            })

        // text will be in tooltip
            
        // nodes
        //     .append('text')
        //     .text(function(d){
        //         return d.stateName;
        //     })
        //     .attr('text-anchor','middle')
        //     .attr('transform','translate('+0+','+4+')');

        //force layout
        var force = d3.layout.force()
            .size([width,height])
            .charge(-20)
            .gravity(0);

        force.nodes(data)
            .on('tick', onForceTick)
            .start();

        function onForceTick(e){
            var q = d3.geom.quadtree(data),
                i = 0,
                n = data.length;

            while( ++i<n ){
                q.visit(collide(data[i]));
            }

            nodes
                .each(gravity(e.alpha*.05))
                .attr('transform',function(d){
                        return 'translate('+d.x+','+d.y+')';
                    })

            function gravity(k){
                return function(d){
                    d.y += (d.y0 - d.y)*k;
                    d.x += (d.x0 - d.x)*k;
                }
            }

            function collide(dataPoint){
                var nr = dataPoint.r + 5,
                    nx1 = dataPoint.x - nr,
                    ny1 = dataPoint.y - nr,
                    nx2 = dataPoint.x + nr,
                    ny2 = dataPoint.y + nr;

                return function(quadPoint,x1,y1,x2,y2){
                    if(quadPoint.point && (quadPoint.point !== dataPoint)){
                        var x = dataPoint.x - quadPoint.point.x,
                            y = dataPoint.y - quadPoint.point.y,
                            l = Math.sqrt(x*x+y*y),
                            r = nr + quadPoint.point.r;
                        if(l<r){
                            l = (l-r)/l*.1;
                            dataPoint.x -= x*= (l*.05);
                            dataPoint.y -= y*= l;
                            quadPoint.point.x += (x*.05);
                            quadPoint.point.y += y;
                        }
                    }
                    return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;
                }
            }
        }

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
	});





function parseData(d){
    //Use the parse function to populate the lookup table of states and their populations/% pop 18+

    obByState.set(+d.STATE,{
        name: d.NAME,
        state: d.STATE,
        pctPark: +d.pctPark,
        income: +d.income,
        popObese: +d.popObese,
        pctObese: +d.pctObese
    });

    return {
        name: d.NAME,
        state: d.STATE,
        pctPark: +d.pctPark,
        income: +d.income,
        popObese: +d.popObese,
        pctObese: +d.pctObese
    };
}
