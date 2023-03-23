import * as echarts from "echarts";
import {getOnBarClick} from "./chartHelpers";
import {createEffect} from "solid-js";

function ChartBar(props) {
    let chart;

    createEffect(() => {
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
            getOnBarClick(props.chartData,
                props.barChartInstance,
                props.setIdenticalVoteProps,
                props.selectPolitician2)
        );
        props.setBarChartInstance(barChart);
    })

    return <div ref={chart} style={props.style}/>
}

export default ChartBar;