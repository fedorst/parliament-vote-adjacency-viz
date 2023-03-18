import links from '/data/coalition_52/links.json';
import nodes from '/data/coalition_52/nodes.json';
import categories from '/data/coalition_52/categories.json';
import * as echarts from "echarts";
import {createSignal, onMount} from "solid-js";

const flip = (data) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);

function Chart() {
    const [graphChartInstance, setGraphChartInstance] = createSignal();
    const [barChartInstance, setBarChartInstance] = createSignal();

    const newCategories = categories.map((c) => {
        c.itemStyle = { color: c.color }
        return c;
    })
    const newLinks = links.map((l) => {
        l.lineStyle = {
            opacity: l.value**4
        }
        return l.value > 0.3 ? l : undefined;
    }).filter(l => l !== undefined);
    const newNodes = nodes.map((n) => {
        n.label = {
            show: true
        }
        return n;
    });
    const nodeIdToName = {}
    newNodes.forEach((n) => { nodeIdToName[n["id"]] = n["name"]; })
    const nameToNodeId = flip(nodeIdToName);
    const nodeIdToCategory = {}
    newNodes.forEach((n) => {
        nodeIdToCategory[n["id"]] = categories[n["category"]];
    })

    const option = {
        title: {
            // text: '52. coalition',
            top: 'bottom',
            left: 'right'
        },
        tooltip: {
            trigger: "item"
        },
        legend: [
            {
                data: newCategories.map(function (a) {
                    return a.name;
                })
            }
        ],
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
            {
                type: 'graph',
                zoom: 0.6,
                // layout: 'force',
                layout: 'circular',
                circular: {
                    rotateLabel: true
                },
                data: newNodes,
                links: newLinks,
                categories: newCategories,
                roam: true,
                label: {
                    position: 'right',
                    formatter: '{b}'
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.3
                },
                tooltip: {
                    formatter: (e) => {
                        if (e['dataType'] !== 'edge') {
                            return `${e['name']} - ${newCategories[e['data']['category']]['name']}`;
                        }
                        return '';
                    }
                }
            }
        ]
    };

    const constructBarOption = (id) => {
        const name = nodeIdToName[id];
        const relatedLinks = links.filter(l => l.source === id).map(l => (
            {
                polId: l.target,
                name: nodeIdToName[l.target],
                value: Math.round(100*l.value)/100,
                category: nodeIdToCategory[l.target].name,
                color: nodeIdToCategory[l.target].color
            }));
        relatedLinks.sort((a,b) => a.value-b.value);

        return {
            title: { text: `${name} voting similarity`},
            tooltip: {trigger: "item"},
            grid: { containLabel: true },
            dataZoom: [
                {
                    type: 'slider',
                    yAxisIndex: 0,
                    zoomLock: true,
                    width: 10,
                    right: 10,
                    start: 80,
                    end: 100,
                    minValueSpan: 28,
                    maxValueSpan: 28,
                    handleSize: 20,
                    brushSelect: false
                },
                {
                    type: 'inside',
                    id: 'insideY',
                    yAxisIndex: 0,
                    start: 80,
                    end: 100,
                    zoomOnMouseWheel: false,
                    moveOnMouseMove: true,
                    moveOnMouseWheel: true
                }
            ],
            yAxis: {
                type: 'category',
                data: relatedLinks.map(l => l.name)
            },
            xAxis: { type: 'value' },
            colorBy: 'data',
            series: [
                {
                    name: relatedLinks.map(l => l.name),
                    data: relatedLinks.map(l => l.value),
                    color: relatedLinks.map(l => l.color),
                    type: 'bar',
                    showBackground: true,
                    backgroundStyle: {
                        color: 'rgba(180, 180, 180, 0.2)'
                    },
                    tooltip: {
                        formatter: `${name} and {b} similarity is {c}`,
                        position: 'right'
                    }
                }
            ]
        };
    }
    const onGraphClick = (n) => {
        const id = n['data']['id'];
        const barOption = constructBarOption(id);
        barChartInstance().hideLoading();
        barChartInstance().setOption(barOption);
    };

    const onBarClick = (n) => {
        const id = nameToNodeId[n['name']];
        const barOption = constructBarOption(id);
        barChartInstance().hideLoading();
        barChartInstance().setOption(barOption);
    };

    let graphElement;
    let barElement;
    onMount(() => {
        const graphChart = echarts.init(graphElement, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        graphChart.setOption(option);
        graphChart.on('click', { dataType: 'node' }, onGraphClick);
        setGraphChartInstance(graphChart);

        const barChart = echarts.init(barElement, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        barChart.showLoading({ text: "Please select a node from the graph on the right", showSpinner: false})
        barChart.setOption({});
        barChart.on('click', onBarClick);
        setBarChartInstance(barChart);
    })

    return (
        <row>
            <div ref={barElement} style={{
                width: "480px",
                height: "768px",
                display: 'inline-block'
            }}/>
            <div ref={graphElement} style={{
                width: "768px",
                height: "768px",
                display: 'inline-block'
            }}/>
        </row>
    );
}

export default Chart;
