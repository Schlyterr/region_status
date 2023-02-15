// The svg
const svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

const keys = ["not_onboarded", "onboarded", "coordination_established", "technical_ability", "working_plan_exist", "publishing_data"]
const colors = ['#FF0000', 'orange', '#FFFF33', 'lightgreen', '#00F000', '#007000']

// Data and color scale
let data = new Map()
const colorScale = d3.scaleOrdinal()
	.domain(keys)
	.range(colors);

// Load external data and boot
Promise.all([
	d3.json("https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/sweden-counties.geojson"),
	d3.csv("https://raw.githubusercontent.com/Schlyterr/region_status/main/region_status.csv", function (d) {
		let state = "not_onboarded"
		switch ("True") {
			case d.publishing_data:
				state = "publishing_data";
				break;
			case d.working_plan_exist:
				state = "working_plan_exist";
				break;
			case d.technical_ability:
				state = "technical_ability";
				break;
			case d.coordination_established:
				state = "coordination_established";
				break;
			case d.onboarded:
				state = "onboarded";
				break;
		}
		if (d.no_municipalities_publishing_data == "?") {
			d.no_municipalities_publishing_data = "0"
		}
		data.set(d.name, { "state": state, "participating_municipalities": d.no_participating_municipalities, "onboarded_municipalities": d.no_municipalties_onboarded, "municipalities_publishing": d.no_municipalities_publishing_data })
	})
]).then(function (loadData) {
	let topo = loadData[0]

	let createLegend = function () {
		let legend = svg.append("g")
			.attr("class", "legend")
	
		legend.selectAll("mydots")
			.data(keys)
			.enter()
			.append("circle")
			.attr("cx", 620)
			.attr("cy", function (d, i) {
				return 45 + i * 25
			})
			.attr("r", 7)
			.style("stroke", "black")
			.style("stroke-width", 1)
			.attr("fill", function (d) {
				return colorScale(d);
			})

		legend.append("text")
			.attr("x", 640)
			.attr("y", 25)
			.attr("font-weight", "bold")
			.text("Region status")

		legend.selectAll("labels")
			.data(keys)
			.enter()
			.append("text")
			.attr("x", 640)
			.attr("y", function (d, i) {
				return 50 + i * 25
			})
			.text(function (d) {
				return d;
			})
	}

	let createTooltipOnClick = function (d) {
		let x = d3.pointer(d)[0]
		let y = d3.pointer(d)[1]

		svg.selectAll(".tooltip").remove()

		let tooltip = svg.append("g")
			.attr("class", "tooltip")

		tooltip.append("rect")
			.attr("x", x)
			.attr("y", y)
			.attr("rx", 5)
			.attr("ry", 5)
			.attr("height", 110)
			.attr("width", 250)
		
		regionName = d3.select(this).data()[0].properties.name
		regionData = data.get(regionName)

		tooltip.append("text")
			.attr("x", x+230)
			.attr("y", y+20)
			.attr("dy", ".35em")
			.attr("class", "closebutton")
			.text("X")
			.on("click", function() {
				svg.selectAll(".tooltip").remove()
			})

		tooltip.append("text")
			.attr("x", x + 10)
			.attr("y", y + 20)
			.attr("dy", ".35em")
			.attr("font-weight", "bold")
			.attr("class", "tooltiptext")
			.text(regionName)

		let i = 40
		Object.entries(regionData).forEach(([key, value]) => {
			tooltip.append("text")
				.attr("x", x + 10)
				.attr("y", y + i)
				.attr("dy", ".35em")
				.attr("class", "tooltiptext")
				.text(`${key}: ${value}`)
			i += 15
		})
	}

	const projection = d3.geoMercator().fitSize([width - 400, height - 200], topo)

	const mapPaths = svg.append("g")
		.selectAll("path")
		.data(topo.features)
		.join("path")

	mapPaths.attr("d", d3.geoPath().projection(projection))
		.attr("fill", function (d) {
			let region = data.get(d.properties.name);
			return colorScale(region.state);
		})
		.attr("stroke", "black")

	mapPaths.on('click', createTooltipOnClick)

	createLegend()
})