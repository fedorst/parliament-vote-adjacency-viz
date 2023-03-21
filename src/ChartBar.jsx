import * as echarts from "echarts";
import {getOnBarClick} from "./chartHelpers";
import {onMount} from "solid-js";

function ChartBar({chartData, barChartInstance, setBarChartInstance, setIdenticalVoteProps, setCardGroupTitle, style=undefined}) {
    let chart;

    onMount(() => {
        chartData = chartData();
        const barChart = echarts.init(chart, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        barChart.showLoading({
            text: "Please select a node from the graph on the left",
            showSpinner: false,
            maskColor: 'rgba(255, 255, 255, 0)',})
        barChart.setOption({});
        barChart.on(
            'click',
            getOnBarClick(chartData.nameToNodeId,
                chartData.nodeIdToName,
                barChartInstance,
                setIdenticalVoteProps,
                setCardGroupTitle)
        );
        setBarChartInstance(barChart);
    })

    return <div ref={chart} style={style}/>
}

export default ChartBar;