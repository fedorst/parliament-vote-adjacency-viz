import links from '/data/coalition_51/links.json';
import nodes from '/data/coalition_51/nodes.json';
import categories from '/data/coalition_51/categories.json';
import {createSignal, onMount} from "solid-js";
import CardGroup from "./CardGroup";
import ChartGraph from "./ChartGraph";
import ChartBar from "./ChartBar";

const flip = (data) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);

/* TODO:

bootstrapify and make responsive the elements (should have 3 elements: graph chart, bar chart and vote list

 */

const linkThreshold = 0.3;

function Chart() {
    const [barChartInstance, setBarChartInstance] = createSignal();
    const [identicalVoteProps, setIdenticalVoteProps] = createSignal();
    const [cardGroupTitle, setCardGroupTitle] = createSignal("");
    const [selectedPolitician1, selectPolitician1] = createSignal("");
    const [selectedPolitician2, selectPolitician2] = createSignal("");
    const [chartData, setChartData] = createSignal();

    onMount(() => {
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
            nodeIdToCategory[n["id"]] = newCategories[n["category"]];
        })

        setChartData({
            nodes: newNodes,
            links: newLinks,
            categories: newCategories,
            unfilteredLinks: links,
            nodeIdToCategory,
            nodeIdToName,
            nameToNodeId
        });
    })

    return (
        <row>
            <ChartGraph
                style={{
                    width: "28%",
                    height: "724px",
                    display: 'inline-block'
            }}
                chartData={chartData}
                barChartInstance={barChartInstance}
            />
            <ChartBar
                style={{
                    width: "28%",
                    height: "724px",
                    display: 'inline-block'
            }}
                chartData={chartData}
                barChartInstance={barChartInstance}
                setBarChartInstance={setBarChartInstance}
                setIdenticalVoteProps={setIdenticalVoteProps}
                setCardGroupTitle={setCardGroupTitle}
            />
            <CardGroup identicalVotes={identicalVoteProps} title={cardGroupTitle}/>
        </row>
    );
}

export default Chart;
