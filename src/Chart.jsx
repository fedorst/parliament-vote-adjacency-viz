import {createEffect, createSignal} from "solid-js";
import CardGroup from "./CardGroup";
import ChartGraph from "./ChartGraph";
import ChartBar from "./ChartBar";
import {Grid, Typography} from "@suid/material";
import {Show} from "solid-js";
const flip = (data) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);

const linkThreshold = 0.3;

function Chart({ selectedCoalition }) {
    const [barChartInstance, setBarChartInstance] = createSignal();
    const [identicalVoteProps, setIdenticalVoteProps] = createSignal();
    const [selectedPolitician1, selectPolitician1] = createSignal("");
    const [selectedPolitician2, selectPolitician2] = createSignal("");
    const [chartData, setChartData] = createSignal();

    createEffect(async () => {
        console.log(`Selected new coalition ${selectedCoalition()}`)
        const categories = (await import(`../data/coalition_${selectedCoalition()}/categories.json`)).default
        const newCategories = categories
            .map((c) => ({...c, itemStyle: {color: c.color}}));

        const links = (await import(`../data/coalition_${selectedCoalition()}/links.json`)).default
        const newLinks = links
            .map((l) => ({...l, lineStyle: {opacity: l.value ** 4}}))
            .filter(l => l.value > linkThreshold);

        const nodes = (await import(`../data/coalition_${selectedCoalition()}/nodes.json`)).default
        const newNodes = nodes
            .map((n) => ({...n, label: {show: true}}));
        const nodeIdToName = {}
        newNodes.forEach((n) => {
            nodeIdToName[n["id"]] = n["name"];
        })
        const nameToNodeId = flip(nodeIdToName);
        const nodeIdToCategory = {}
        newNodes.forEach((n) => {
            nodeIdToCategory[n["id"]] = newCategories[n["category"]];
        })

        const votesMatrix = (await import(`../data/coalition_${selectedCoalition()}/votesMatrix.json`)).default
        const votesMetadata = (await import(`../data/coalition_${selectedCoalition()}/votesMetadata.json`)).default

        selectPolitician1("")
        selectPolitician2("")

        setChartData({
            nodes: newNodes,
            links: newLinks,
            categories: newCategories,
            unfilteredLinks: links,
            nodeIdToCategory,
            nodeIdToName,
            nameToNodeId,
            votesMatrix,
            votesMetadata
        });
    });

    return (
        <Show when={chartData() !== undefined} keyed>
            <Grid container spacing={2} justifyContent='space-evenly' style={{"width": "90%", "margin": "auto"}}>
                <Grid item xs={12} lg={6} xl={4}>
                    <Typography variant="h6" style={{ "font-weight": "bold"}}>{`Vote adjacency in the ${selectedCoalition()}. coalition`}</Typography>
                    <ChartGraph
                        style={{
                            height: "724px",
                        }}
                        chartData={chartData}
                        barChartInstance={barChartInstance}
                        selectPolitician1={selectPolitician1}
                        selectPolitician2={selectPolitician2}
                    />
                </Grid>
                <Grid item xs={12} md={5} lg={4}>
                    <Show when={selectedPolitician1() !== ""} fallback={"Please select a MP from the graph"} keyed>
                        <Typography variant="h6" style={{ "font-weight": "bold"}}>{`${selectedPolitician1()} most similar voters`}</Typography>
                    <ChartBar
                        style={{
                        height: "724px",
                    }}
                        chartData={chartData}
                        barChartInstance={barChartInstance}
                        setBarChartInstance={setBarChartInstance}
                        setIdenticalVoteProps={setIdenticalVoteProps}
                        selectedPolitician1={selectedPolitician1()}
                        selectPolitician2={selectPolitician2}
                        />
                    </Show>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    <Show when={selectedPolitician2() !== ""} fallback={"Please select a comparison MP from the bar chart"} keyed>
                        <Typography variant="h6" style={{ "font-weight": "bold"}}>{`${selectedPolitician1()} and ${selectedPolitician2()} vote similarity`}</Typography>
                    <CardGroup
                        style={{
                            height: "724px",
                        }}
                        identicalVotes={identicalVoteProps}/>
                    </Show>
                </Grid>
            </Grid>
        </Show>



    );
}

export default Chart;
