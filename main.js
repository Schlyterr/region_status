// The svg
const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const keys = ["5", "4", "3", "2", "1"]
const colors = ["#3dd27c", "#79db18", "#ffff00", "#ffb212", "#ff7053"]

const columnNameToStringObject = {
	coordination_established: "Regional samordning etablerad",
	working_plan_exist: "Handlingsplan finns",
	region_publishing_data: "Regionen publicerar data",
	no_municipalities_in_region: "Antal kommuner i regionen",
	no_participating_municipalities: "Antal medverkande kommuner",
	no_municipalities_publishing_data: "Antal kommuner som publicerar data",
}
let columnNameToStringMapping = new Map(Object.entries(columnNameToStringObject))

const statusMapping = {
	"true": "Ja",
	"false": "Nej",
}

const colorScale = d3.scaleOrdinal()
	.domain(keys)
	.range(colors);

// Load external data and boot
Promise.all([
	d3.json("https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/sweden-counties.geojson"),
	d3.json("https://demo.entryscape.com/rowstore/dataset/8d485f03-87ec-4e43-9c76-d6267c9ae576/json")
	.then(function (d) {
		var data = new Map(d.results.map(i => [i.region, {
			tooltipData: {
				coordination_established: statusMapping[i.coordination_established.toString().toLowerCase()],
				working_plan_exist: statusMapping[i.working_plan_exist.toString().toLowerCase()],
				region_publishing_data: statusMapping[i.region_publishing_data.toString().toLowerCase()],
				no_municipalities_in_region: i.no_municipalities_in_region,
				no_participating_municipalities: i.no_participating_municipalities,
				no_municipalities_publishing_data: i.no_municipalities_publishing_data,	
			},
			regionStatus: i.ndv_goal_achievement,
		}]))
		return data
	}),
]).then(function (loadData) {
	let topo = loadData[0]
	let data = loadData[1]

	let createTooltipOnClick = function (d) {
		let x = d3.pointer(d)[0]
		let y = d3.pointer(d)[1]

		svg.selectAll(".tooltip").remove()

		let tooltip = svg.append("g")
			.attr("class", "tooltip")

		regionName = d3.select(this).data()[0].properties.name
		regionData = data.get(regionName).tooltipData
		tooltipTextRows = Object.keys(regionData).length
		tooltipHeight = 80 + tooltipTextRows*12

		tooltipY = y
		if (y+tooltipHeight > height) {
			tooltipY = height - tooltipHeight
		}

		tooltipWidth = 280
		tooltipX = x
		if (x+tooltipWidth > width) {
			tooltipX = width - tooltipWidth
		}

		tooltip.append("rect")
			.attr("x", tooltipX)
			.attr("y", tooltipY)
			.attr("rx", 5)
			.attr("ry", 5)
			.attr("height", tooltipHeight)
			.attr("width", tooltipWidth)
		
		tooltip.append("text")
			.attr("x", tooltipX+260)
			.attr("y", tooltipY+20)
			.attr("dy", ".35em")
			.attr("class", "closebutton")
			.text("X")
			.on("click", function() {
				svg.selectAll(".tooltip").remove()
			})

		tooltip.append("text")
			.attr("x", tooltipX + 10)
			.attr("y", tooltipY + 20)
			.attr("dy", ".35em")
			.attr("font-weight", "bold")
			.attr("class", "tooltiptext")
			.text(`Region ${regionName}`)
		
		let i = 40
		Object.entries(regionData).forEach(([key, value]) => {
			tooltip.append("text")
				.attr("x", tooltipX + 10)
				.attr("y", tooltipY + i)
				.attr("dy", ".35em")
				.attr("class", "tooltiptext")
				.text(`${columnNameToStringMapping.get(key)}: ${value}`)
			i += 18
		})
	}

	const projection = d3.geoMercator().fitSize([width, height], topo)

	const mapPaths = svg.append("g")
		.selectAll("path")
		.data(topo.features)
		.join("path")

	mapPaths.attr("d", d3.geoPath().projection(projection))
		.attr("fill", function (d) {
			let region = data.get(d.properties.name);
			return colorScale(region.regionStatus);
		})
		.attr("stroke", "black")

	mapPaths.on('click', createTooltipOnClick)
})