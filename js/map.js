$.getJSON("data/keyValues.json", function( data ) {

	var keyValues = data.keyValues;
	var episodeLengths = data.episodeLengths;
	var locations = data.sceneLocSorted;

	const width = episodeLengths[episodeLengths.length-1].episodes[episodeLengths[episodeLengths.length-1].episodes.length-1].shift/100;
	const height = 2*locations[locations.length-1].middle + locations[locations.length-1].max;

	const svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height);

	var titlePoints = [];
	var points = [];

	// from: http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
	d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
    d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };

    // build the array of points from keyValues
	keyValues.forEach(function(d,i){
		points.push([]);
		titlePoints.push([]);
		keyValues[i].values.forEach(function(e,j){
			// check if start and end are mismatched
			if(keyValues[i].values[j].s > keyValues[i].values[j].e){
				console.log(keyValues[i].key, j);
			}
			
			// additional variables: title (t), alive (a), born (b), greensight (g), flashback (f), warg (w)
			
			// ignore flashbacks, greensight, warging, not yet born
			if(keyValues[i].values[j].f || keyValues[i].values[j].g || keyValues[i].values[j].w || keyValues[i].values[j].b == false){}
			// for everything else
			else {
				var objStart = {};
				var objEnd = {};
				objStart = {"x":keyValues[i].values[j].s, "y":keyValues[i].values[j].y, "c": keyValues[i].key};
				objEnd = {"x":keyValues[i].values[j].e, "y":keyValues[i].values[j].y, "c": keyValues[i].key};
				// if they have a title, otherwise add null
				if(keyValues[i].values[j].t){
					objStart.t = keyValues[i].values[j].t;
					objEnd.t = keyValues[i].values[j].t;
				} else {
					objStart.t = null;
					objEnd.t = null;
				}
				// if they die
				if(keyValues[i].values[j].a == false){
					objEnd.a == false;
				}
				points[i].push(objStart);
				points[i].push(objEnd);
				
				// add title points to titlePoints
				if(keyValues[i].values[j].t){
					titlePoints[i].push(objStart);
					titlePoints[i].push(objEnd);
				} else {
					titlePoints[i].push(null);
				}
			}
		});
	});
	
	// modify titlePoints
	var titlePointsAdj = [];

	// remove objects that only have null values
	for(i=0; i<titlePoints.length; i++){
		for(j=0; j<titlePoints[i].length; j++){
			if(titlePoints[i][j] != null){
				titlePointsAdj.push(titlePoints[i]);
				break;
			}
		}
	}
	titlePoints = titlePointsAdj;
	// remove initial null values
	for(i=0; i<titlePoints.length; i++){
		var toSplice = 0;
		for(j=0; j<titlePoints[i].length; j++){
			if(titlePoints[i][j] == null){
				toSplice++;
			} else {
				break;
			}
		}
		titlePoints[i] = titlePoints[i].slice(toSplice,titlePoints[i].length);
	}
	
	// if two types of titles, then split into separate objects

	var lineFunction = d3.line()
		.x(function(d) { return d.x/100; })
		.y(function(d) { return 2*d.y; })
		.curve(d3.curveMonotoneX);

	var discontinuousLineFunction = d3.line()
		.defined(function(d) { return d; })
		.x(function(d) { return d.x/100; })
		.y(function(d) { return 2*d.y; })
		.curve(d3.curveMonotoneX);

	// add rectangles representing each region
	locations.forEach(function(d,i){
		var regionName = d.name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		svg.append("rect")
			.attr("class", "region "+regionName)
			.attr("height", 2*d.max)
			.attr("width", width)
			.attr("x", 0)
			.attr("y", (2*d.middle)-d.max);
		svg.append("text")
			.attr("class", "region")
            .text(d.name.replace("#",""))
            .style("font-size", function(){
            	var threshold = 100;
            	if(2*d.max > threshold){
            		return threshold;
            	} else {
            		return 2*d.max;
            	}
            })
            .attr("x", 10)
            .attr("y", 2*d.middle+2)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start");
        svg.append("text")
			.attr("class", "region")
            .text(d.name.replace("#",""))
            .style("font-size", function(){
            	var threshold = 100;
            	if(2*d.max > threshold){
            		return threshold;
            	} else {
            		return 2*d.max;
            	}
            })
            .attr("x", width-10)
            .attr("y", 2*d.middle+2)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "end");
	});

	// add rectangles representing each episode or season
	episodeLengths.forEach(function(d,i){
		// add rectangles for each season
		/* svg.append("rect")
			.attr("class", "season")
			.attr("height", height+10)
			.attr("width", d.length/100)
			.attr("x", d.shift/100)
			.attr("y", -5)
			.attr("fill", "none"); */
		// add rectangles for each episode
		episodeLengths[i].episodes.forEach(function(e,j){
			episodeTitle = e.episodeTitle.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			svg.append("g")
				.attr("class", episodeTitle);
			svg.select("."+episodeTitle)
				.append("rect")
				.attr("class", "episode season"+episodeLengths[i].seasonNum)
				.attr("height", height+10)
				.attr("width", e.length/100)
				.attr("x", e.shift/100)
				.attr("y", -5);
		});
		episodeLengths[i].episodes.forEach(function(e,j){
			episodeTitle = e.episodeTitle.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			// add episode title to top
			svg.select("."+episodeTitle)
				.append("text")
				.attr("class", "episodeTitle")
	            .text("\"" + e.episodeTitle + "\" (S"+ d.seasonNum + ":E" + e.episodeNum + ")")
	            .attr("x", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 5){
	            		return e.shift/100;
	            	}
	            	else if(d.seasonNum == 6 && e.episodeNum >= 8){
	            		return (e.shift + e.length)/100;
	            	}
	            	else {
	            		return (e.shift + e.length/2)/100;
	            	}
	            })
	            .attr("y", -5)
	            .attr("dominant-baseline", "ideographic")
	            .attr("text-anchor", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 5){
	            		return "start";
	            	}
	            	else if(d.seasonNum == 6 && e.episodeNum >= 8){
	            		return "end";
	            	}
	            	else {
	            		return "middle";
	            	}
	            });
	        // add episode title to bottom
	        svg.select("."+episodeTitle)
				.append("text")
				.attr("class", "episodeTitle")
	            .text("\"" + e.episodeTitle + "\" (S"+ d.seasonNum + ":E" + e.episodeNum + ")")
	            .attr("x", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 5){
	            		return e.shift/100;
	            	}
	            	else if(d.seasonNum == 6 && e.episodeNum >= 8){
	            		return (e.shift + e.length)/100;
	            	}
	            	else {
	            		return (e.shift + e.length/2)/100;
	            	}
	            })
	            .attr("y", height + 5)
	            .attr("dominant-baseline", "text-before-edge")
	            .attr("text-anchor", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 5){
	            		return "start";
	            	}
	            	else if(d.seasonNum == 6 && e.episodeNum >= 8){
	            		return "end";
	            	}
	            	else {
	            		return "middle";
	            	}
	            });
		})
	});

	// for each valid character, make a group
	keyValues.forEach(function(d,i){
		if(points[i].length > 0){
			var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			// make the group
			svg.append("g")
				.attr("class", className + " characters");
		}
	});

	// for each character who dies, add a circle at that spot
	keyValues.forEach(function(d,i){
		var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		d.values.forEach(function(e,j){
			if(e.a == false){
				svg.select("g."+className)
					.append("circle")
					.attr("cx", function(){return e.e/100;})
					.attr("cy", function(){return 2*e.y;})
					.attr("class", "dead");
			}
		});
	});

	// for each valid character with a title, add title line to the group
	titlePoints.forEach(function(d,i){
		var className = d[0].c.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		svg.select("g."+className).selectAll("paths")
			.data([d])
			.enter()
			.append("path")
			.attr("class", "titleLine "+d[0].t.toLowerCase())
			.attr("d", discontinuousLineFunction);
	});

	// for each valid character, add the linear path to the group
	keyValues.forEach(function(d,i){
		if(points[i].length > 0){
			var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			svg.select("g."+className).selectAll("paths")
				.data([points[i]])
				.enter()
				.append("path")
				.attr("class", "line")
				.attr("d", lineFunction);
		}
	});

	// append the rectangles & text representing each scene to the group
	keyValues.forEach(function(d,i){
		var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		keyValues[i].values.forEach(function(e,j){
			var width = (keyValues[i].values[j].e - keyValues[i].values[j].s)/100;
			var height = 4;
			svg.select("g."+className)
				.append("rect")
		        .attr("x", keyValues[i].values[j].s/100)
		        .attr("y", 2*keyValues[i].values[j].y-(height/2))
		        .attr("width", width)
		        .attr("height", 3)
		        .attr("class", "rect");
		});
		svg.select("g."+className)
	    	.append("text")
	    	.attr("class", "character")
            .text(keyValues[i].key)
            .style("font", "400 20px Helvetica Neue")
            .attr("dominant-baseline", "hanging")
            .attr("text-anchor", "end");
	});

	// bring the group (includes the path and rectangles) to the front when rolled over and show the text label
	svg.selectAll("g.characters")
		.on('mouseover', function(d) {
            d3.select(this).moveToFront();
            d3.selectAll(".character")
            	.attr("x", function(){
            		if(d3.mouse(this)[0] < 200){
            			return d3.mouse(this)[0]+10+$(window).scrollLeft();
            		} else {
            			return d3.mouse(this)[0]-10+$(window).scrollLeft();
            		}
            	})
            	.attr("y", d3.mouse(this)[1]+10)
            	.attr("text-anchor", function(){
            		if(d3.mouse(this)[0] < 200){
            			return "start";
            		} else {
            			return "end";
            		}
            	});
        });
})

// add house-specific styling to lines
.done(function(){
	$("#loading").hide();
	$.getJSON( "data/characters-houses.json", function( data ) {
		var house = data.house;
		for(i=0; i<house.length; i++){
			for(j=0; j<house[i].characters.length; j++){
				var className = house[i].characters[j].toLowerCase().replace(/([^A-Z0-9])/gi,"");
				var houseName = house[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
				$("."+className).addClass(houseName);
				if(houseName !== "include"){
					$("."+className).addClass("include");
				}
			}
		}

		// build the key - include: houses, hand/khal/khaleesi/king, dead, in scene

		const keyScale = 410;

		const key = d3.select("#key").append("svg")
			.attr("width", keyScale)
			.attr("height", (9/16)*keyScale);

		const selectKey = d3.select("#key").select("svg");

		// to draw the lines
		var lineFunction = d3.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.curve(d3.curveLinear);

		// add key title
		selectKey.append("text")
			.attr("class", "region")
            .text("Key")
            .style("font-size", 30)
            .attr("x", 0)
            .attr("y", -5)
            .attr("dominant-baseline", "hanging")
            .attr("text-anchor", "start");
		
		// add a group for each house
		for(i=0; i<house.length; i++){
			var houseName = house[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			selectKey.append("g")
				.attr("class", houseName);
			// add special lines and points (King, Khaleesi, Khal, Hand, Dead)
			if(houseName == "stark"){
				selectKey.select("g."+houseName).selectAll("paths")
					.data([[{"x":100*Math.random()+50,"y":16*i+35},{"x":200,"y":16*i+35}]])
					.enter()
					.append("path")
					.attr("class", "king")
					.attr("d", lineFunction);
			} else if(houseName == "targaryen"){
				selectKey.select("g."+houseName).selectAll("paths")
					.data([[{"x":100*Math.random()+50,"y":16*i+35},{"x":200,"y":16*i+35}]])
					.enter()
					.append("path")
					.attr("class", "khaleesi")
					.attr("d", lineFunction);
			} else if(houseName == "dothraki"){
				selectKey.select("g."+houseName).selectAll("paths")
					.data([[{"x":100*Math.random()+50,"y":16*i+35},{"x":200,"y":16*i+35}]])
					.enter()
					.append("path")
					.attr("class", "khal")
					.attr("d", lineFunction);
			} else if(houseName == "lannister"){
				selectKey.select("g."+houseName).selectAll("paths")
					.data([[{"x":100*Math.random()+50,"y":16*i+35},{"x":200,"y":16*i+35}]])
					.enter()
					.append("path")
					.attr("class", "hand")
					.attr("d", lineFunction);
			} else if(houseName == "tyrell" || houseName == "frey"){
				selectKey.select("g."+houseName)
					.append("circle")
					.attr("cx", 150)
					.attr("cy", 16*i+35)
					.attr("class", "dead");
			}

			// add house line
			selectKey.select("g."+houseName).selectAll("paths")
				.data(function(){
					// different lengths for dead lines
					if(houseName == "tyrell" || houseName == "frey"){
						return [[{"x":0,"y":16*i+35},{"x":150,"y":16*i+35}]]
					} else {
						return [[{"x":0,"y":16*i+35},{"x":200,"y":16*i+35}]]
					}
				})
				.enter()
				.append("path")
				.attr("class", "line")
				.attr("d", lineFunction);

			// add line label
			selectKey.select("g."+houseName).append("text")
	            .text(house[i].name)
	            .attr("class", "keyLabel")
	            .attr("x", 215)
	            .attr("y", 16*i+35)
	            .attr("dominant-baseline", "middle")
	            .attr("text-anchor", "start");
		}

		// modify special key labels
		$(".stark .keyLabel").html("Stark + King");
		$(".targaryen .keyLabel").html("Targaryen + Khaleesi");
		$(".lannister .keyLabel").html("Lannister + Hand");
		$(".dothraki .keyLabel").html("Dothraki + Khal");
		$(".tyrell .keyLabel").html("Tyrell + Dead");
		$(".frey .keyLabel").html("Frey + Dead");
		$(".include .keyLabel").html("Other");

		// add .include to all ines
		for(i=0; i<house.length; i++){
			var houseName = house[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			if(houseName !== "include"){
				$("."+houseName).addClass("include");
			}
		}
	});
});