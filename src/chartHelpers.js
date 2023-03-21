import votesMatrix from "../data/coalition_51/votesMatrix.json";
import votesMetadata from "../data/coalition_51/votesMetadata.json";

const getGraphOption = (nodes, links, categories) => {
    return {
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
                data: categories.map(function (a) {
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
                        return '';
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
};

const getOnGraphClick = (nodeIdToName, nodeIdToCategory, links, barChartInstance) => {
    return (n) => {
        const id = n['data']['id'];
        const barOption = getBarOption(id, nodeIdToName, nodeIdToCategory, links); // use unfiltered links
        barChartInstance().hideLoading();
        barChartInstance().setOption(barOption);
    };
};

const getOnBarClick = (nameToNodeId,
                       nodeIdToName,
                       permittedVoteValues,
                       forbiddenVoteTypes,
                       barChartInstance,
                       setIdenticalVoteProps,
                       setCardGroupTitle) => {
    return (n) => {
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
}

export { getGraphOption, getBarOption, getOnGraphClick, getOnBarClick };