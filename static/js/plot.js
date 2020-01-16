    function drawAppliancePlot() {
        d3.select("#legends").selectAll("*").remove();
        d3.select("#dataviz").selectAll("*").remove();

        var selectedMonth = jQuery("#month").val();
        var selectedRO = jQuery("#room_orientation").val();
        
        var margin = {top: 40, right: 100, bottom: 50, left: 60},
            parentWidth = d3.select('#dataviz').style('width').slice(0, -2),
            parentHeight = d3.select('#dataviz').style('height').slice(0, -2),
            width = parentWidth - margin.left - margin.right,
            height = parentHeight - margin.top - margin.bottom; // (parentWidth / 2.236)
        
        var svg = d3.select("#dataviz")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
                return {
                    Month: +d.Month,
                    Hour: +d.Hour,
                    ToDP: +d["ToDP"],
                    SP_l250: +d["SP_l250"],
                    SP_g250: +d["SP_g250"],
                };
            }).then(function(data) {
                var filteredData = data.filter(function(d) {
                    return d.Month == selectedMonth;
                });

                var color = d3.scaleOrdinal(d3.schemeCategory10);
                color.domain(d3.keys(filteredData[0]).filter(function(key) {
                    return key != "Hour" && key != "Month"
                }));

                var priceVals = color.domain().map(function(name) {
                    return {
                        name: name,
                        values: filteredData.map(function(d) {
                            return {
                                hour: +d.Hour,
                                price: +d[name]
                            };
                        })
                    };
                });
            
                // Add Legends
                var legend = svg.selectAll('g')
                                .data(priceVals)
                                    .enter()
                                .append('g')
                                    .attr('class', 'legend');

                legend.append('rect')
                    .attr('x', function(d, i) {
                        return (i * 200) + 20;
                    })
                    .attr('y', function(d, i) {
                        return height + 35;
                    })
                    .attr('width', 10)
                    .attr('height', 10)
                    .style('fill', function(d) {
                        return color(d.name);
                    });

                legend.append('text')
                    .attr('x', function(d, i) {
                        return (i * 200) + 40;
                    })
                    .attr('y', function(d, i) {
                        return height + 45;
                    })
                    .text(function(d) {
                        return d.name;
                    });

                // Add X axis
                var x = d3.scaleLinear()
                        .domain([-1, 23])
                        .range([0, width]);

                svg.append("g")
                    .attr("class", "x axis")
                    .style("font", "13px sans-sarif")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x)
                        .tickFormat(function (d) {
                            if (d < 10) {
                                d = "0" + d + ":00";
                            } else {
                                d = d + ":00";
                            }
                            return d;
                        }));
                
                // Add Y Left axis
                var yLeft = d3.scaleLinear()
                            .domain([
                                d3.min(priceVals, function(t) {
                                    return d3.min(t.values, function(v) {
                                        return v.price;
                                    });
                                }), 
                                d3.max(priceVals, function(t) {
                                    return d3.max(t.values, function(v) {
                                        return v.price;
                                    });
                                })])
                            .range([height, 0]);
                
                svg.append("g")
                    .attr("class", "y axis")
                    .style("font", "13px sans-sarif")
                    .call(d3.axisLeft(yLeft).ticks(10));
                    
                svg.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 0-margin.left)
                        .attr("x", 0-(height/2))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text("Electricity Price (in cents/kWh)");
                
                // Plot Data
                var drawLine = d3.line()
                                .x(function(d) { return x(d.hour); })
                                .y(function(d) { return yLeft(d.price); });
                
                svg.selectAll(".price")
                    .data(priceVals)
                        .enter()
                    .append("g")
                        .attr("class", "price")
                    .append("path")
                        .attr("class", "line")
                        .attr("d", function(d) {
                            return drawLine(d.values)                   
                        })
                        .attr("stroke", function(d) {
                            return color(d.name);
                        })
                        .attr("stroke-width", 1.5)
                        .attr("fill", "none")
                    .append("text")
                        .datum(function(d) {
                            return {
                                name: d.name,
                                value: d.values[d.values.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return "translate(" + x(d.value.hour) + "," + yLeft(d.value.price) + ")";
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name;
                        });
                
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
        
                var mousePerLine = mouseG.selectAll('.mouse-per-line')
                    .data(priceVals)
                    .enter()
                    .append("g")
                        .attr("class", "mouse-per-line");
                
                mousePerLine.append("circle")
                        .attr("r", 5)
                        .style("stroke", function(d) {
                            return color(d.name);
                        })
                        .style("fill", function(d) {
                            return color(d.name);
                        })
                        .style("stroke-width", "1px")
                        .style("opacity", "0");
                
                mousePerLine.append("text")
                        .attr("transform", "translate(10, -5)")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "13px")
                        .attr("fill", function(d) {
                            return color(d.name);
                        });

                mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
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
                                var xHour = x.invert(mouse[0]),
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
                                    .text(x.invert(pos.x).toFixed(0) + ":00 " + yLeft.invert(pos.y).toFixed(2) + String.fromCharCode(162) + "/kWh");
                  
                                return "translate(" + mouse[0] + "," + pos.y + ")";
                            });
                        });
            })
    }

    function drawLightPlot() {
        d3.select("#legends").selectAll("*").remove();
        d3.select("#dataviz").selectAll("*").remove();

        var selectedMonth = jQuery("#month").val();
        var selectedRO = jQuery("#room_orientation").val();
        
        var margin = {top: 40, right: 100, bottom: 50, left: 60},
            parentWidth = d3.select('#dataviz').style('width').slice(0, -2),
            parentHeight = d3.select('#dataviz').style('height').slice(0, -2),
            width = parentWidth - margin.left - margin.right,
            height = parentHeight - margin.top - margin.bottom; // (parentWidth / 2.236)
        
        var svg = d3.select("#dataviz")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
                return {
                    Month: +d.Month,
                    Hour: +d.Hour,
                    Solar_Radiation: +d["SRP_" + selectedRO],
                    Shading: 5
                };
            }).then(function(data) {
                var filteredData = data.filter(function(d) {
                    return d.Month == selectedMonth;
                });

                var color = d3.scaleOrdinal(d3.schemeCategory10);
                color.domain(d3.keys(filteredData[0]).filter(function(key) {
                    return key != "Hour" && key != "Month"
                }));

                var lightVals = color.domain().map(function(name) {
                    return {
                        name: name,
                        values: filteredData.map(function(d) {
                            return {
                                hour: +d.Hour,
                                radiation: +d[name]
                            };
                        })
                    };
                });
            
                // Add Legends
                var legend = svg.selectAll('g')
                                .data(lightVals)
                                    .enter()
                                .append('g')
                                    .attr('class', 'legend');

                legend.append('rect')
                    .attr('x', function(d, i) {
                        return (i * 200) + 20;
                    })
                    .attr('y', function() {
                        return height + 35;
                    })
                    .attr('width', 10)
                    .attr('height', 10)
                    .style('fill', function(d) {
                        return color(d.name);
                    });

                legend.append('text')
                    .attr('x', function(d, i) {
                        return (i * 200) + 40;
                    })
                    .attr('y', function() {
                        return height + 45;
                    })
                    .text(function(d) {
                        return d.name;
                    });

                // Add X axis
                var x = d3.scaleLinear()
                        .domain([-1, 23])
                        .range([0, width]);

                svg.append("g")
                    .attr("class", "x axis")
                    .style("font", "13px sans-sarif")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x)
                        .tickFormat(function (d) {
                            if (d < 10) {
                                d = "0" + d + ":00";
                            } else {
                                d = d + ":00";
                            }
                            return d;
                        }));
                
                // Add Y Left axis
                var yLeft = d3.scaleLinear()
                            .domain([
                                d3.min(lightVals, function(t) {
                                    return d3.min(t.values, function(v) {
                                        return v.radiation;
                                    });
                                }), 
                                d3.max(lightVals, function(t) {
                                    return d3.max(t.values, function(v) {
                                        return v.radiation;
                                    });
                                })])
                            .range([height, 0]);
                
                svg.append("g")
                    .attr("class", "y axis")
                    .style("font", "13px sans-sarif")
                    .call(d3.axisLeft(yLeft).ticks(10));
                    
                svg.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 0-margin.left)
                        .attr("x", 0-(height/2))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text("Solar Radiations (in %)");
                
                // Plot Data
                var drawLine = d3.line()
                                .x(function(d) { return x(d.hour); })
                                .y(function(d) { return yLeft(d.radiation); });
                
                svg.selectAll(".radiation")
                    .data(lightVals)
                        .enter()
                    .append("g")
                        .attr("class", "radiation")
                    .append("path")
                        .attr("class", "line")
                        .attr("d", function(d) {
                            return drawLine(d.values)                   
                        })
                        .attr("stroke", function(d) {
                            return color(d.name);
                        })
                        .attr("stroke-width", 1.5)
                        .attr("fill", "none")
                    .append("text")
                        .datum(function(d) {
                            return {
                                name: d.name,
                                value: d.values[d.values.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return "translate(" + x(d.value.hour) + "," + yLeft(d.value.radiation) + ")";
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name;
                        });
                
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
        
                var mousePerLine = mouseG.selectAll('.mouse-per-line')
                    .data(lightVals)
                    .enter()
                    .append("g")
                        .attr("class", "mouse-per-line");
                
                mousePerLine.append("circle")
                        .attr("r", 5)
                        .style("stroke", function(d) {
                            return color(d.name);
                        })
                        .style("fill", function(d) {
                            return color(d.name);
                        })
                        .style("stroke-width", "1px")
                        .style("opacity", "0");
                
                mousePerLine.append("text")
                        .attr("transform", "translate(10, -5)")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "13px")
                        .attr("fill", function(d) {
                            return color(d.name);
                        });

                mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
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
                                var xHour = x.invert(mouse[0]),
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
                                    .text(x.invert(pos.x).toFixed(0) + ":00 " + yLeft.invert(pos.y).toFixed(2) + "%");
                  
                                return "translate(" + mouse[0] + "," + pos.y +")";
                            });
                        });
            })
    }

    function drawPlot () {
        d3.select("#legends").selectAll("*").remove();
        d3.select("#dataviz").selectAll("*").remove();

        var selectedMonth = jQuery("#month").val();
        var selectedRO = jQuery("#room_orientation").val();
        
        var margin = {top: 40, right: 100, bottom: 50, left: 60},
            parentWidth = d3.select('#dataviz').style('width').slice(0, -2),
            parentHeight = d3.select('#dataviz').style('height').slice(0, -2),
            width = parentWidth - margin.left - margin.right,
            height = parentHeight - margin.top - margin.bottom; // (parentWidth / 2.236)
        
        var svg = d3.select("#dataviz")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //var legend = d3.select("#legends")
        //              .append("svg")
        //                  .attr("width", d3.select('#legends').style('width').slice(0, -2) + margin.left + margin.right)
        //                  .attr("height", 20);

        d3.csv("static/data/nycNRELwSRpMedian.csv", function(d) {
                return {
                    Month: +d.Month,
                    Hour: +d.Hour,
                    Dry_Bulb_Temperature: (((+d.DBT) * 9) / 5) + 32,
                    Wet_Bulb_Temperature: (((+d.WBT) * 9) / 5) + 32,
                    Solar_Radiation: +d["SRP_" + selectedRO],
                    Set_Point_Temperature: 58
                };
            }).then(function(data) {
                var filteredData = data.filter(function(d) {
                    return d.Month == selectedMonth;
                });

                var color = d3.scaleOrdinal(d3.schemeCategory10);
                color.domain(d3.keys(filteredData[0]).filter(function(key) {
                    return key != "Hour" && key != "Month" && key != "Solar_Radiation"
                }));

                var tempVals = color.domain().map(function(name) {
                    return {
                        name: name,
                        values: filteredData.map(function(d) {
                            return {
                                hour: +d.Hour,
                                temperature: +d[name]
                            };
                        })
                    };
                });
            
                // Add Legends
                var legend = svg.selectAll('g')
                                .data(tempVals)
                                    .enter()
                                .append('g')
                                    .attr('class', 'legend');

                legend.append('rect')
                    .attr('x', function(d, i) {
                        return (i * 200) + 20;
                    })
                    .attr('y', function() {
                        return height + 35;
                    })
                    .attr('width', 10)
                    .attr('height', 10)
                    .style('fill', function(d) {
                        return color(d.name);
                    });

                legend.append('text')
                    .attr('x', function(d, i) {
                        return (i * 200) + 40;
                    })
                    .attr('y', function() {
                        return height + 45;
                    })
                    .text(function(d) {
                        return d.name;
                    });

                // Add X axis
                var x = d3.scaleLinear()
                        .domain([-1, 23])
                        .range([0, width]);

                svg.append("g")
                    .attr("class", "x axis")
                    .style("font", "13px sans-sarif")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x)
                        .tickFormat(function (d) {
                            if (d < 10) {
                                d = "0" + d + ":00";
                            } else {
                                d = d + ":00";
                            }
                            return d;
                        }));
                
                // Add Y Left axis
                var yLeft = d3.scaleLinear()
                            .domain([
                                d3.min(tempVals, function(t) {
                                    return d3.min(t.values, function(v) {
                                        return v.temperature;
                                    });
                                }) - 1, 
                                d3.max(tempVals, function(t) {
                                    return d3.max(t.values, function(v) {
                                        return v.temperature;
                                    });
                                }) + 1])
                            .range([height, 0]);
                
                svg.append("g")
                    .attr("class", "y axis")
                    .style("font", "13px sans-sarif")
                    .call(d3.axisLeft(yLeft).ticks(10));
                    
                svg.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 0-margin.left)
                        .attr("x", 0-(height/2))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text("Temperature (ºF)");
                
                // Add Y Right axis
                var yRight = d3.scaleLinear()
                            .domain([d3.min(filteredData, function(t) {
                                return t.Solar_Radiation;
                            }), d3.max(filteredData, function(t) {
                                return t.Solar_Radiation;
                            })])
                            .range([height, 0]);
                
                svg.append("g")
                    .attr("class", "y axis")
                    .style("font", "13px sans-sarif")
                    .attr("transform", "translate( " + width + ", 0 )")
                    .call(d3.axisRight(yRight).ticks(10));
                    
                svg.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", width+margin.right/2)
                        .attr("x", 0-(height/2))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text("Solar Radiation (in %)");

                // Plot Data
                var drawLine = d3.line()
                                .x(function(d) { return x(d.hour); })
                                .y(function(d) { return yLeft(d.temperature); });
                var solarline = d3.line()
                                .x(function(d) { return x(d.Hour); })
                                .y(function(d) { return yRight(d.Solar_Radiation); });

                svg.selectAll(".temperature")
                    .data(tempVals)
                        .enter()
                    .append("g")
                        .attr("class", "temperature")
                    .append("path")
                        .attr("class", "line")
                        .attr("d", function(d) {
                            return drawLine(d.values)                   
                        })
                        .attr("stroke", function(d) {
                            return color(d.name);
                        })
                        .attr("stroke-width", 1.5)
                        .attr("fill", "none")
                    .append("text")
                        .datum(function(d) {
                            return {
                                name: d.name,
                                value: d.values[d.values.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return "translate(" + x(d.value.hour) + "," + yLeft(d.value.temperature) + ")";
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name;
                        });
                
                svg.append("path")
                    .data([filteredData])
                    .attr("class", "line")
                    .attr("d", solarline)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1.5)
                    .style("stroke-dasharray", "5,5")
                    .style("opacity", 0.2)
                    .attr("fill", "yellow");
            
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
        
                var mousePerLine = mouseG.selectAll('.mouse-per-line')
                    .data(tempVals)
                    .enter()
                    .append("g")
                        .attr("class", "mouse-per-line");
                
                mousePerLine.append("circle")
                        .attr("r", 5)
                        .style("stroke", function(d) {
                            return color(d.name);
                        })
                        .style("fill", function(d) {
                            return color(d.name);
                        })
                        .style("stroke-width", "1px")
                        .style("opacity", "0");
                
                mousePerLine.append("text")
                        .attr("transform", "translate(10, -5)")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "13px")
                        .attr("fill", function(d) {
                            return color(d.name);
                        });

                mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
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
                                var xHour = x.invert(mouse[0]),
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
                                    .text(x.invert(pos.x).toFixed(0) + ":00 " + yLeft.invert(pos.y).toFixed(2) + String.fromCharCode(176) + "F");
                  
                                return "translate(" + mouse[0] + "," + pos.y +")";
                            });
                        });
            })
    }

    function resizeSVG() {
        
        margin = {top: 10, right: 100, bottom: 30, left: 60},
        parentWidth = d3.select('#dataviz').style('width').slice(0, -2),
        width = parentWidth - margin.left - margin.right,
        height = (parentWidth / 3.236) - margin.top - margin.bottom;
        
        d3.select('#dataviz svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    }
    
    // window.addEventListener('resize', resizeSVG);
                // Show confidence interval
                /* svg.append("path")
                    .datum(filteredData)
                        .attr("fill", "#cce5df")
                        .attr("stroke", "none")
                        .attr("d", d3.area()
                            .x(function(d) { return x(d.Hour) })
                            .y0(function(d) { return y(d.TempVals_ciright) })
                            .y1(function(d) { return y(d.TempVals_cileft) })
                        )

                // Show confidence interval
                svg.append("path")
                    .datum(filteredData)
                        .attr("fill", "#bbe5df")
                        .attr("stroke", "none")
                        .attr("d", d3.area()
                            .x(function(d) { return x(d.Hour) })
                            .y0(function(d) { return y(d.DewVals_ciright) })
                            .y1(function(d) { return y(d.DewVals_cileft) })
                        )
                */ 