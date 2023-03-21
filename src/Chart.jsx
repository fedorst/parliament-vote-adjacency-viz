import links from '/data/coalition_51/links.json';
import nodes from '/data/coalition_51/nodes.json';
import categories from '/data/coalition_51/categories.json';
import * as echarts from "echarts";
import {createSignal, onMount} from "solid-js";
import CardGroup from "./CardGroup";
import {getGraphOption, getOnBarClick, getOnGraphClick} from "./chartHelpers";

const flip = (data) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);
const permittedVoteValues = ["POOLT", "VASTU", "ERAPOOLETU"];
const forbiddenVoteTypes = ["Päevakorra kinnitamine", "Töö ajagraafiku kehtestamine"]

/* TODO: separate chart into graph and bar elements.
bootstrapify and make responsive the elements (should have 3 elements: graph chart, bar chart and vote list

 */

const linkThreshold = 0.3;

function Chart() {
    const [_, setGraphChartInstance] = createSignal();
    const [barChartInstance, setBarChartInstance] = createSignal();
    const [identicalVoteProps, setIdenticalVoteProps] = createSignal();
    const [cardGroupTitle, setCardGroupTitle] = createSignal("");

    const newCategories = categories
        .map((c) => ({ ...c, itemStyle: { color: c.color } }));
    const newLinks = links
        .map((l) => ({ ...l, lineStyle: { opacity: l.value**4 }}))
        .filter(l => l.value > linkThreshold);
    const newNodes = nodes
        .map((n) => ({...n, label: { show: true }}));
    const nodeIdToName = {}
    newNodes.forEach((n) => { nodeIdToName[n["id"]] = n["name"]; })
    const nameToNodeId = flip(nodeIdToName);
    const nodeIdToCategory = {}
    newNodes.forEach((n) => {
        nodeIdToCategory[n["id"]] = categories[n["category"]];
    })

    let graphElement;
    let barElement;
    onMount(() => {
        const graphChart = echarts.init(graphElement, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        graphChart.setOption(getGraphOption(newNodes, newLinks, newCategories));
        graphChart.on(
            'click',
            { dataType: 'node' },
            getOnGraphClick(nodeIdToName, nodeIdToCategory, links, barChartInstance)
        );
        setGraphChartInstance(graphChart);

        const barChart = echarts.init(barElement, null, {
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
            getOnBarClick(nameToNodeId,
                nodeIdToName,
                permittedVoteValues,
                forbiddenVoteTypes,
                barChartInstance,
                setIdenticalVoteProps,
                setCardGroupTitle)
        );
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
