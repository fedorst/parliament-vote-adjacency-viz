## Estonian parliament voting similarity visualization

In this visualization, I use the parliament API to download vote data and see how similar the various parliamentarians are in their voting behavior. The project is live [here](https://fedorst-parlviz.web.app/).

### Generating the coalition data
To pull coalition data for the 53rd coalition and generate links using the jaccard's proximity metric, run `python generateJson.py 53 jaccards` in the data folder. See supported coalitions in the keys of `data/coalitionData.json`. Other proximity metrics are `count` and `fracMul`.