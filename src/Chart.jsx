import links from '/data/coalition_51/links.json';
import nodes from '/data/coalition_51/nodes.json';
import categories from '/data/coalition_51/categories.json';
import votesMatrix from '/data/coalition_51/votesMatrix.json';
import votesMetadata from '/data/coalition_51/votesMetadata.json';
import * as echarts from "echarts";
import {createSignal, onMount} from "solid-js";
import CardGroup from "./CardGroup";

const flip = (data) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);
const permittedVoteValues = ["POOLT", "VASTU", "ERAPOOLETU"];
const forbiddenVoteTypes = ["Päevakorra kinnitamine", "Töö ajagraafiku kehtestamine"]

function Chart() {
    const [_, setGraphChartInstance] = createSignal();
    const [barChartInstance, setBarChartInstance] = createSignal();
    const [identicalVoteProps, setIdenticalVoteProps] = createSignal();
    const [cardGroupTitle, setCardGroupTitle] = createSignal("");

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
            name: { id },
            title: { text: `${name} voting similarity`},
            tooltip: {trigger: "item"},
            grid: {
                left: "40%",
                containLabel: false
            },
            dataZoom: [
                {
                    type: 'slider',
                    yAxisIndex: 0,
                    zoomLock: true,
                    width: 10,
                    right: 10,
                    start: 80,
                    end: 100,
                    minValueSpan: 32,
                    maxValueSpan: 32,
                    handleSize: 20,
                    brushSelect: false,
                    filterMode: 'none'
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
        const prevId = barChartInstance().getOption()["name"]["id"];
        const id = nameToNodeId[n['name']];

        const arr1 = votesMatrix[prevId];
        const arr2 = votesMatrix[id];
        const identicalVotes = [];
        Object.keys(arr1).forEach((key) => {
            if (arr1[key] === arr2[key] && permittedVoteValues.includes(arr1[key]) && !forbiddenVoteTypes.includes(votesMetadata[key]["description"])) {
                const o = {...votesMetadata[key]}
                o["vote"] = arr1[key];
                identicalVotes.push(o);
            }
        });
        setIdenticalVoteProps(identicalVotes);
        const cardGroupTitle = `${nodeIdToName[prevId]} and ${nodeIdToName[id]} matching votes`
        setCardGroupTitle(cardGroupTitle);
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
        barChart.showLoading({ text: "Please select a node from the graph on the left", showSpinner: false, maskColor: 'rgba(255, 255, 255, 0)',})
        barChart.setOption({});
        barChart.on('click', onBarClick);
        setBarChartInstance(barChart);
    })

    return (
        <row>
            <div ref={graphElement} style={{
                width: "28%",
                height: "724px",
                display: 'inline-block'
            }}/>
            <div ref={barElement} style={{
                width: "28%",
                height: "724px",
                display: 'inline-block'
            }}/>
            <CardGroup identicalVotes={identicalVoteProps} title={cardGroupTitle}/>
        </row>
    );
}

export default Chart;
