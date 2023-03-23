import {createEffect} from "solid-js";
import * as echarts from "echarts";
import {getGraphOption, getOnGraphClick} from "./chartHelpers";

function ChartGraph(props) {
    let chart;
    createEffect(() => {
        const graphChart = echarts.init(chart, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        graphChart.setOption(getGraphOption(
            props.chartData))
        graphChart.on(
            'click',
            { dataType: 'node' },
            getOnGraphClick(
                props.chartData,
                props.selectPolitician1,
                props.barChartInstance
            )
        )
    })
    return <div ref={chart} style={props.style}/>
}

export default ChartGraph;