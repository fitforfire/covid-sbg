import json
from datetime import datetime

import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd


def main():
    map_zip = "zip://./src/Salzburg.zip!Salzburg_BEV_VGD_250_LAM.shp"
    salzburg = gpd.read_file(map_zip)
    # simplify districts
    salzburg = salzburg.dissolve(by='PG')

    report_dir = "./docs/report/"

    # get Up to date covid Data
    covidData = pd.read_csv(report_dir + 'aktiv.csv').set_index('Gemeinde')
    last_updated = datetime.strptime(covidData.columns[-1], "%Y-%m-%dT%H:%M:%S.%fZ")
    # rename last column
    covidData.columns = [*covidData.columns[:-1], 'aktiv']

    # get Population for relative numbers
    with open(report_dir + "population.json") as population_file:
        population = json.load(population_file)
    population = pd.DataFrame(population, index=["population"]).transpose()

    covid_data = pd.DataFrame(covidData['aktiv'])
    covid_data = covid_data.join(population)

    covid_data['relativeActive'] = covid_data['aktiv'] / covid_data['population'] * 1000

    # some fixes of city names
    covid_data = covid_data.rename(index={
        'Salzburg Stadt': 'Salzburg',
        'Bruck an der Glocknerstraße': 'Bruck an der Großglocknerstraße',
        'Fusch an der Glocknerstraße': 'Fusch an der Großglocknerstraße',
        'Sankt Martin im Tennengebirge': 'Sankt Martin am Tennengebirge',
        'Hollersbach': 'Hollersbach im Pinzgau',
    })

    plot_data = salzburg.join(covid_data)[['relativeActive', 'geometry']]
    plot_data.plot(column='relativeActive', figsize=(20, 10), legend=True)
    plt.axis('off')
    plt.title('Aktive Fälle in den Salzburger Gemeinden pro 1.000 Einwohner', fontsize=20)
    plt.suptitle('Stand: ' + last_updated.strftime('%d.%m.%Y %H:%m'))
    plt.savefig(report_dir + "aktiv.png")


if __name__ == '__main__':
    main()
