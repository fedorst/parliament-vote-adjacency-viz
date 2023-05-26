## Project for the Network Science course at the University of Tartu

Files relevant for the project are found in the folder `data`.  
Folder `data/experiments` contains Jupyter analysis notebooks which were used in the project. The report and presentation of this project can also be found in that folder.
The parliament voting data used in the project is defined in the file `coalitionData.json` and stored in `data/coalition_[n]` where `n` is the corresponding key and all of "Hääleandja" (opinion survey) data is located in the folder `data/haaleandja`.


## Estonian parliament voting similarity visualization

In this visualization, I use the parliament API to download vote data and see how similar the various parliamentarians are in their voting behavior. The project is live [here](https://fedorst-parlviz.web.app/).

### Generating the coalition data
To pull coalition data for the 53rd coalition and generate links using the jaccard's proximity metric, run `python generateJson.py 53 jaccards` in the data folder. See supported coalitions in the keys of `data/coalitionData.json`. Other proximity metrics are `count` and `fracMul`.
