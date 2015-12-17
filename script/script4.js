var margin = {t:50,r:100,b:50,l:50};
var width = document.getElementById('map').clientWidth - margin.r - margin.l,
    height = document.getElementById('map').clientHeight - margin.t - margin.b;

var map = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','map')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Set up projection and geo path generator
var projection = d3.geo.albersUsa()
	.translate([width/2, height/2]);

var path = d3.geo.path()
	.projection(projection);

var obByState = d3.map();
var centroidByState = d3.map();

//Scales
var scaleR = d3.scale.linear().domain([100000,6300000]).range([8,80]),
    scaleColor = d3.scale.linear().domain([12,27]).range(['white','#B74077']),
    scaleX = d3.scale.linear().domain([0,90]).range([0,width]),
    scaleY = d3.scale.linear().domain([30000,70000]).range([height,0]);

var axisX = d3.svg.axis()
    .orient('top')
    .tickSize(-height,0)
    .ticks(2)
    .tickValues([0,100])
    .scale(scaleX),

    axisY = d3.svg.axis()
    .orient('left')
    .tickSize(-width,0)
    .ticks(2)
    .tickValues([0,80000])
    .scale(scaleY);



//force
var force = d3.layout.force()
    .size([width,height])
    .charge(-30)
    .gravity(0);

//legend
var legend = d3.select('.legend')
    .append('img')
    .style('opacity',0)
    .attr('src','legend1.svg');

// axis labels
axis_label_dy = ['Income Per Capita']
axis_label_dx = ['% of People Living Within 1/2 mile of a Park']

var axis_x = map.append('g')
    .attr('class','axis')
    .style('fill','rgb(180,180,180)')
    .attr('transform','translate(30,'+height+')');
var axis_x_l = axis_x.selectAll('.axis-x')
    .data(axis_label_dx);
var axis_x_l_enter = axis_x_l.enter()
    .append('text').attr('class', 'axis-x')
    .attr('text-anchor','right')
    .style('opacity',0);   
var axis_x_l_exit = axis_x_l.exit().remove();
    axis_x_l.text(function(d) {return d;})

var axis_y = map.append('g')
    .attr('class','axis')
    .style('fill','rgb(180,180,180)')
    .attr('transform', 'translate(30,570) rotate(-90)');
var axis_y_l = axis_y.selectAll('.axis-y')
    .data(axis_label_dy);
var axis_y_l_enter = axis_y_l.enter()
    .append('text').attr('class', 'axis-y')
    .attr('text-anchor','right') 
    .style('opacity',0);   
var axis_y_l_exit = axis_y_l.exit().remove();
    axis_y_l.text(function(d) {return d;});

//import data
queue()
	.defer(d3.json, "data/states.json")
    .defer(d3.csv, "data/parkIncOb.csv", parseData)
	.await(dataLoaded);

function dataLoaded(err, states, obesity){ 
    //create data 
    var data = states.features.map(function(d){
        //if a state is not in both data files, return nothing
        if(!obByState.get(+d.properties.STATE)){return;
        } else {

            var centroid = path.centroid(d);

            centroidByState.set(d.properties.NAME, centroid)
                return {
                    stateName:d.properties.NAME,
                    state:+d.properties.STATE,
                    x0:centroid[0],
                    y0:centroid[1],
                    x:centroid[0],
                    y:centroid[1],
                    r:scaleR((obByState.get(+d.properties.STATE).popObese)),
                    pctObese: ((obByState.get(+d.properties.STATE).pctObese)),
                    pctPark: ((obByState.get(+d.properties.STATE).pctPark)),
                    popObese: ((obByState.get(+d.properties.STATE).popObese)),
                    abbr: ((obByState.get(+d.properties.STATE).abbr)),
                    income: ((obByState.get(+d.properties.STATE).income))
                }
        }
    }),
    
    //PR filter
    data = data.filter(function(d){return d!=undefined});

    console.log(data);

    //names
    var names = map.selectAll('.stateAbr')
        .data(data, function(d){return d.state});

    //state name labels
    function nameLabels(data){
        names
            .enter()
            .append('text')
            .attr('class','stateAbr')
            .text(function(d){
                return (obByState.get(+d.state)).abbr;
            })
            .attr('text-anchor','middle')
            .attr('transform','translate('+0+','+4+')');

        names.exit()
            .transition()
            .remove();
    }
    
    //node selection
    var nodes = map.selectAll('.state')
        .data(data, function(d){return d.state});

    //appending state circles, enter exit update      
    nodes
        .append('circle')
        .attr('class','state')
        .attr('r',5)
        .style('fill','#B74077')
        .call(attachTooltip);

    nodes.exit()
        .transition()
        .remove();

    //scatterplot function, 1st button
    function scatter(data){
        nodes
            .attr('transform', function(d){
                return 'translate('+scaleX(d.pctPark)+','+scaleY(d.income)+')';
            })
    }
    //scaled scatter function, 2nd button
    function scale(data){
        nodes
            .transition().duration(400)
            .attr('r', function(d){
                return scaleR(d.popObese);
            })
            .style('fill', function(d){
                return scaleColor(d.pctObese)
            })
            .style('stroke','white')
            .style('stroke-width',.5)
    }
    //cartogram function, 3rd button
    function cartogram(data){
        force.nodes(data)
                .on('tick', onForceTick)
                .start();
    }

    //button selection
    d3.selectAll('.btn').on('click', function(){

        var selection = d3.select(this).attr('id');

        if(selection == 'scatterplot'){
            force.stop();

            names.style('opacity',0);

            nodes
                .attr('transform', function(d){
                    return 'translate('+scaleX(d.pctPark)+','+scaleY(d.income)+')';
                })

            legend.style('opacity',0);
            axis_x_l_enter.style('opacity',1);
            axis_y_l_enter.style('opacity',1);


        } else if (selection == 'scaled') {
            force.stop();

            names.style('opacity',0);

            nodes
                .transition().duration(400)
                .attr('r', function(d){
                    return scaleR(d.popObese);
                })
                .style('fill', function(d){
                    return scaleColor(d.pctObese)
                })
                .style('stroke','white')
                .style('stroke-width',.5)
            
            legend.style('opacity',1);
            axis_x_l_enter.style('opacity',1);
            axis_y_l_enter.style('opacity',1);

        }  else {
            
            names.style('opacity',1);

            force.nodes(data)
                    .on('tick', onForceTick)
                    .start();
            
            legend.style('opacity',1);
            axis_x_l_enter.style('opacity',0);
            axis_y_l_enter.style('opacity',0);
        }
    })

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

}



function attachTooltip(selection){
    selection
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            
            tooltip
                .transition()
                .style('opacity',1);
           
            tooltip.select('#name').html(d.stateName);
            tooltip.select('#obese').html(d.pctObese);
            tooltip.select('#park').html(d.pctPark); 
            tooltip.select('#income').html(d.income); 
        })

        .on('mouseleave',function(){
            d3.select('.custom-tooltip')
                .style('opacity',0);
        }) 

        .on('mouseover',function(){
            var xy = d3.mouse(map.node());
            
            d3.select('.custom-tooltip')
                .style('opacity',1)
                .style('left', xy[0]+60+'px')
                .style('top', xy[1]+60+'px');
        })    
}

function parseData(d){
    //Use the parse function to populate the lookup table of states and their populations/% pop 18+

    obByState.set(+d.STATE,{
        name: d.NAME,
        state: d.STATE,
        pctPark: +d.pctPark,
        income: +d.income,
        popObese: +d.popObese,
        pctObese: +d.pctObese,
        abbr: d.ABR
    })

    return {
        name: d.NAME,
        state: d.STATE,
        pctPark: +d.pctPark,
        income: +d.income,
        popObese: +d.popObese,
        pctObese: +d.pctObese,
        abbr: d.ABR
    };
}