import {onMount} from "solid-js";
import * as echarts from "echarts";
import {getGraphOption, getOnGraphClick} from "./chartHelpers";

function ChartGraph({chartData, barChartInstance, style=undefined, }) {
    let chart;
    onMount(() => {
        const graphChart = echarts.init(chart, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        graphChart.setOption(getGraphOption(chartData.nodes, chartData.links, chartData.categories))
        graphChart.on(
            'click',
            { dataType: 'node' },
            getOnGraphClick(chartData.nodeIdToName, chartData.nodeIdToCategory, chartData.unfilteredLinks, barChartInstance)
        )

    })
    return <div ref={chart} style={style}/>
}

export default ChartGraph;