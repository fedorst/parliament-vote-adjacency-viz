const getGraphOption = (chartData) => {
    const { nodes, links, categories } = chartData();
    return {
        title: {
            // text: '52. coalition',
            top: 'bottom',
            left: 'right'
        },
        tooltip: {
            trigger: "item",
            position: 'right'
        },
        legend: {
                formatter: (name) => {
                    return categories.find(c=>c.name === name)?.nameShort;
                }
            },
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
                data: nodes,
                links: links,
                categories: categories,
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
                            return `${e['name']} - ${categories[e['data']['category']]['name']}`;
                        }
                        return undefined;
                    }
                }
            }
        ]
    };
};

const getBarOption = (id, nodeIdToName, nodeIdToCategory, links) => {
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
        // title: { text: `${name} voting similarity`},
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
        xAxis: { type: 'value', max: 1, min: 0 },
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
};

const getOnGraphClick = (chartData, selectPolitician1, selectPolitician2, barChartInstance) => {
    return (n) => {
        const { nodeIdToName, nodeIdToCategory, unfilteredLinks } = chartData();
        const id = n['data']['id'];
        selectPolitician1(nodeIdToName[id]);
        selectPolitician2("");
        const barOption = getBarOption(id, nodeIdToName, nodeIdToCategory, unfilteredLinks); // use unfiltered links
        barChartInstance().setOption(barOption);
    };
};

const permittedVoteValues = ["POOLT", "VASTU", "ERAPOOLETU"];
const forbiddenVoteTypes = ["Päevakorra kinnitamine", "Töö ajagraafiku kehtestamine"]

const getOnBarClick = (chartData,
                       barChartInstance,
                       setIdenticalVoteProps,
                       selectPolitician2
) => {
    return (n) => {
        const {nameToNodeId, votesMatrix, votesMetadata} = chartData();
        const prevId = barChartInstance().getOption()["name"]["id"];
        const id = nameToNodeId[n['name']];
        selectPolitician2(n['name']);
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
    };
}

export { getGraphOption, getBarOption, getOnGraphClick, getOnBarClick };
