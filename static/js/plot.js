function preProcessData(data, selectedMonth, excludeCols) {
    var filteredData = data.filter(function(d) {
        return d.Month == selectedMonth;
    });
    
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    color.domain(d3.keys(filteredData[0]).filter(function(key) {
        return !excludeCols.includes(key);
    }));

    var vals = color.domain().map(function(name) {
        return {
            name: name,
            values: filteredData.map(function(d) {
                return {
                    hour: +d.Hour,
                    param: +d[name]
                };
            })
        };
    });

    return [filteredData, color, vals];
}

function plotData(data, axisInfo, colorArr, labelArr, dataLabels, outputVar) {
    
    // remove old plots
    d3.select("#dataviz").selectAll("*").remove();
    
    /*
    // redefine margin, width, and height
    var marginLabels = {top: 50, right: 0, bottom: 0, left: 5},
        parentLabelWidth = d3.select('#datalabel').style('width').slice(0, -2),
        parentLabelHeight = d3.select('#datalabel').style('height').slice(0, -2),
        widthLabel = parentLabelWidth - marginLabels.left - marginLabels.right,
        heightLabel = parentLabelHeight - marginLabels.top - marginLabels.bottom; // (parentWidth / 2.236)
    
    // create a visualisation frame
    var svgLabel = d3.select("#datalabel")
                .append("svg")
                    .attr("width", widthLabel + marginLabels.left + marginLabels.right)
                    .attr("height", heightLabel + marginLabels.top + marginLabels.bottom)
                .append("g")
                    .attr("transform", "translate(" + marginLabels.left + "," + marginLabels.top + ")");
    */
    // redefine margin, width, and height
    var margin = {top: 120, right: 80, bottom: 60, left: 50},
        parentWidth = d3.select('#dataviz').style('width').slice(0, -2),
        parentHeight = (1 / parentWidth) * 230000, // d3.select('#dataviz').style('height').slice(0, -2),
        width = parentWidth - margin.left - margin.right,
        height = parentHeight - margin.top - margin.bottom; // (parentWidth / 2.236)

    // create a visualisation frame
    var svg = d3.select("#dataviz")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // create bottom x-axis
    var xBottom = d3.scaleLinear()
                    .domain([-1, 23])
                    .range([0, width]);

    // add bottom x-axis
    svg.append("g")
        .attr("class", "x axis")
        .style("font", "13px sans-sarif")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xBottom)
            .tickFormat(function (d) {
                if (d < 10) {
                    d = "0" + d + ":00";
                } else {
                    d = d + ":00";
                }
                return d;
            }));
    
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom * 2 / 3) + ")")
        .style("text-anchor", "middle")
        .text("Hour of the Day");
    
    var axisKeys = d3.keys(axisInfo);
    var axisDic = {};
    for (var i=0; i < axisKeys.length; i++) {
        
        // get data
        var subData = data.filter(function(d){return axisInfo[axisKeys[i]].includes(d.name);});
    
        // create y-axis
        axisDic[axisKeys[i]] = d3.scaleLinear()
                                    .domain([
                                        d3.min(subData, function(t) {
                                            return d3.min(t.values, function(v) {
                                                return v.param;
                                            });
                                        }), 
                                        d3.max(subData, function(t) {
                                            return d3.max(t.values, function(v) {
                                                return v.param;
                                            });
                                        }) + 1])
                                    .range([height, 0]);
        
        var yAxisTextPos = 0 - margin.left;
        if (axisKeys[i] == "left") { // add left y-axis
            svg.append("g")
                .attr("class", "y axis " + axisKeys[i])
                .style("font", "13px sans-sarif")
                .call(d3.axisLeft(axisDic[axisKeys[i]]).ticks(10));
        } else { // add right y-axis
            svg.append("g")
                .attr("class", "y axis " + axisKeys[i])
                .style("font", "13px sans-sarif")
                .attr("transform", "translate( " + width + ", 0 )")
                .call(d3.axisRight(axisDic[axisKeys[i]]).ticks(10));
            yAxisTextPos = width + margin.right / 2;
        }
        
        // add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", yAxisTextPos)
            .attr("x", 0 - height/2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(labelArr["y" + axisKeys[i] + "Label"]);

        // function to draw line on y-axis
        var drawLineFunc = d3.line()
                            .x(function(d) { return xBottom(d.hour); })
                            .y(function(d) { return axisDic[axisKeys[i]](d.param); });
    
        // create line for data to be plotted on left axis
        var dataLine = svg.selectAll("." + labelArr[axisKeys[i] + "ClassLabel"])
                        .data(subData)
                            .enter()
                        .append("g")
                            .attr("class", labelArr[axisKeys[i] + "ClassLabel"])
    
        // add line for data to be plotted on y-axis
        dataLine.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return drawLineFunc(d.values)                   
            })
            .attr("stroke", function(d) {
                return colorArr(d.name);
            })
            .attr("stroke-width", 1.5)
            .attr("opacity", function(d) {
                if (d.name == outputVar) {return 1;} else {return 0.2;}
            })
            .attr("fill", function(d){
                if (d.name == "SR") {return "yellow";} else {return "none";}
            });
    }
    
    // To handle mouse events   
    var mouseG = svg.append("g")
                    .attr("class", "mouse-over-effects");

    // this is the black vertical line to follow mouse
    mouseG.append("path")
        .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", "0");     

    var lines = jQuery('.line');
    
    // mouse event on each line
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(data)
        .enter()
        .append("g")
            .attr("class", "mouse-per-line");
    
    // add circle on the mouse event
    mousePerLine.append("circle")
            .attr("r", 3)
            .style("stroke", function(d) {
                return colorArr(d.name);
            })
            .style("fill", function(d) {
                return colorArr(d.name);
            })
            .style("stroke-width", "1px")
            .style("opacity", "0");

    // add text on each line
    mousePerLine.append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "13px")
            .attr("fill", function(d) {
                return colorArr(d.name);
            });

    // append a rect to catch mouse movements on canvas
    mouseG.append('svg:rect') 
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function() { // on mouse out hide line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
        })
        .on('mouseover', function() { // on mouse in show line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
        })
        .on('mousemove', function() { // mouse moving over canvas
            var mouse = d3.mouse(this);
            d3.select(".mouse-line")
                .attr("d", function() {
                    var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                    return d;
                });
            d3.selectAll(".mouse-per-line")
                .attr("transform", function(d, i) {
                    var xHour = xBottom.invert(mouse[0]),
                        bisect = d3.bisector(function(d) { return d.hour; }).right;
                        idx = bisect(d.values, xHour);

                    var beginning = 0,
                        end = lines[i].getTotalLength(),
                        target = null;

                    while (true) {
                        target = Math.floor((beginning + end) / 2);
                        pos = lines[i].getPointAtLength(target);
                        if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                            break;
                        }
                        if (pos.x > mouse[0])      end = target;
                        else if (pos.x < mouse[0]) beginning = target;
                        else break; //position found
                    }
                    d3.select(this).select('text')
                        .text(function(d){
                            if(axisInfo["left"].includes(d.name)) { 
                                return xBottom.invert(pos.x).toFixed(0) + ":00 " + axisDic["left"].invert(pos.y).toFixed(2) + labelArr["leftSuffix"];
                            } else {
                                return xBottom.invert(pos.x).toFixed(0) + ":00 " + axisDic["right"].invert(pos.y).toFixed(2) + labelArr["rightSuffix"];
                            }
                        })
                        
                    return "translate(" + mouse[0] + "," + pos.y + ")";
                });
            });
    
    // add dots for the legend
    svg.selectAll("mydots")
        .data(data)
            .enter()
        .append("circle")
            .attr("cx", function(d, i){return margin.left / 2;})
            .attr("cy", function(d, i){return i * 20 - margin.top * 2 / 3;}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 4)
            .style("fill", function(d){return colorArr(d.name)})
    
    // add label for each dot
    svg.selectAll("mylabels")
        .data(data)
            .enter()
        .append("text")
            .attr("x", function(d, i){return margin.left * 5 / 6;})
            .attr("y", function(d, i){return i * 20 - margin.top * 2 / 3;}) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function(d){ return colorArr(d.name)})
            .attr("opacity", function(d) {
                if (d.name == outputVar) {return 1;} else {return 0.4;}
            })
            .text(function(d){ return dataLabels[d.name]})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")

    return svg;
}

function drawAppliancePlot() {

    // select month and room orientation
    var selectedMonth = jQuery("#month").val();
    var selectedRO = jQuery("#room_orientation").val();
        
    // read particular columsn of CSV     
    d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
        return {
            Month: +d.Month,
            Hour: +d.Hour,
            ToDP: +d["ToDP"],
            SP_l250: +d["SP_l250"],
            SP_g250: +d["SP_g250"],
        };
    }).then(function(data) {
        
        // labels for the legend
        var dataLabels = {
            Month: "Month",
            Hour: "Hour",
            ToDP: "Time of Day Price",
            SP_l250: "Standard Price (<250 kWh)",
            SP_g250: "Standard Price (>=250 kWh)",
        }

        // parameters needed for plotting
        var labelArr = {
            yleftLabel: "Electricity Price (in " + String.fromCharCode(162) + "/kWh)",
            leftSuffix: String.fromCharCode(162) + "/kWh",
            leftClassLabel: "price"
        }

        // preprocess and filter data
        var excludeCols = ["Hour", "Month"],
            axisInfo = {left:["ToDP", "SP_l250", "SP_g250"]};
        
        var dataArray = preProcessData(data, selectedMonth, excludeCols),
            filteredData = dataArray[0],
            colorArr = dataArray[1],
            priceVals = dataArray[2];

        outputVar = "ToDP";
        
        // generate and plot data on a SVG frame
        var svg = plotData(priceVals, axisInfo, colorArr, labelArr, dataLabels, outputVar);
        
    })
}

function drawLightPlot() {
    var selectedMonth = jQuery("#month").val();
    var selectedRO = jQuery("#room_orientation").val();

    d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
        return {
            Month: +d.Month,
            Hour: +d.Hour,
            SR: +d["SRP_" + selectedRO],
            Shading: d3.max([0, ((+d["SRP_" + selectedRO] - +d["SR_REC"]) * 100.0) / (+d["SRP_" + selectedRO] + 1)]),
            Lighting: d3.max([0, +d["SR_REC"] - d3.max([0, ((+d["SRP_" + selectedRO] - +d["SR_REC"]) * 100.0) / (+d["SRP_" + selectedRO] + 1)])])
        };
    }).then(function(data) {

        // labels for the legend
        var dataLabels = {
            Month: "Month",
            Hour: "Hour",
            SR: "Light Through Window (in %)",
            Shading: "Recommended Shading (in %)",
            Lighting: "Recommended Lighting (in %)",
        }
                
        // parameters needed for plotting
        var labelArr = {
            yleftLabel: "Scale (in %)",
            yrightLabel: "Scale (in %)",
            leftSuffix: "%",
            rightSuffix: "%",
            leftClassLabel: "lighting",
            rightClassLabel: "percentscale"
        }
        
        // preprocess and filter data
        var excludeCols = ["Hour", "Month"],
            axisInfo = {left:["SR", "Shading"], right:["Lighting"]};
        
        var dataArray = preProcessData(data, selectedMonth, excludeCols),
            filteredData = dataArray[0],
            colorArr = dataArray[1],
            lightVals = dataArray[2];
                
        outputVar = "Lighting";
        
        // generate and plot data on a SVG frame
        var svg = plotData(lightVals, axisInfo, colorArr, labelArr, dataLabels, outputVar);
        
    })
}

function drawPTACPlot () {
    var selectedMonth = jQuery("#month").val();
    var selectedRO = jQuery("#room_orientation").val();
    var selectedOT = jQuery("#occType").val();

    d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
        var ma_diff = +d["SPT_" + selectedOT + "Ma"] - +d["SPT_" + selectedOT];
        var mi_diff = +d["SPT_" + selectedOT + "Mi"] - +d["SPT_" + selectedOT];
        
        var dbtFA = (((+d.DBT) * 9) / 5) + 32;
        var tempDiff = +d["SPT_" + selectedOT] - dbtFA;
        
        var deltaT = Math.ceil((tempDiff > 0) ? d3.min([ma_diff, d3.max([0, tempDiff])]) : d3.max([mi_diff, d3.min([0, tempDiff])]));
        
        return {
            Month: +d.Month,
            Hour: +d.Hour,
            DBT: dbtFA,
            SPT: +d["SPT_" + selectedOT] + deltaT,
            RH: +d["RH"],
            SR: +d["SRP_" + selectedRO]
        };
    }).then(function(data) {
        
        // labels for the legend
        var dataLabels = {
            Month: "Month",
            Hour: "Hour",
            DBT: "Outside Air Temperature (in " + String.fromCharCode(176) + "F" + ")",
            RH: "Relative Humidity (in %)",
            SR: "Light Through Window (in %)",
            SPT: "Recommended Set Temperature (in " + String.fromCharCode(176) + "F" + ")"
        }
        
        // parameters needed for plotting
        var labelArr = {
            yleftLabel: "Temperature (in " + String.fromCharCode(176) + "F" + ")",
            yrightLabel: "Scale (in %)",
            leftSuffix: String.fromCharCode(176) + "F",
            rightSuffix: "%",
            leftClassLabel: "temperature",
            rightClassLabel: "percentscale"
        }
        
        // preprocess and filter data
        var excludeCols = ["Hour", "Month"],
            axisInfo = {left:["DBT", "SPT"], right:["RH", "SR"]};
        
        var dataArray = preProcessData(data, selectedMonth, excludeCols),
            filteredData = dataArray[0],
            colorArr = dataArray[1],
            tempVals = dataArray[2];
                
        outputVar = "SPT";
        
        // generate and plot data on a SVG frame
        var svg = plotData(tempVals, axisInfo, colorArr, labelArr, dataLabels, outputVar);
        
        /*

        svg.append("path")
            .data([filteredData])
            .attr("class", "line")
            .attr("d", solarline)
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .style("stroke-dasharray", "5,5")
            .style("opacity", 0.2)
            .attr("fill", "yellow");
        */
    })
}

function reloadLayout() {
    console.log('static/images/floorPlans/' + document.getElementById("apt_type").value + 'BR.jpg');
    document.getElementById('aptLayout').src = 'static/images/floorPlans/' + document.getElementById("apt_type").value + 'BR.jpg';
}