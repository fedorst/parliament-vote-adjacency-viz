## Project for the Network Science course at the University of Tartu

Files relevant for the project are found in the folder `data`.  
Folder "experiments" contains Jupyter notebooks which were used as analysis for the project.  
The data sets used in the project are `coalitionData.json` and all of "Hääleandja" data is located in the folder `haaleandja`.


## Estonian parliament voting similarity visualization

In this visualization, I use the parliament API to download vote data and see how similar the various parliamentarians are in their voting behavior. The project is live [here](https://fedorst-parlviz.web.app/).

### Generating the coalition data
To pull coalition data for the 53rd coalition and generate links using the jaccard's proximity metric, run `python generateJson.py 53 jaccards` in the data folder. See supported coalitions in the keys of `data/coalitionData.json`. Other proximity metrics are `count` and `fracMul`.
