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
