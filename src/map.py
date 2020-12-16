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
    covid_data = pd.read_csv(report_dir + 'aktiv.csv').set_index('Gemeinde')
    last_updated = datetime.strptime(covid_data.columns[-1], "%Y-%m-%dT%H:%M:%S.%fZ")
    # rename last column
    covid_data['sevenDaysMean'] = covid_data.iloc[:, -7:].mean(axis=1)

    # get Population for relative numbers
    with open(report_dir + "population.json") as population_file:
        population = json.load(population_file)
    population = pd.DataFrame(population, index=["population"]).transpose()

    covid_data = covid_data.join(population)

    covid_data['relativeActive'] = covid_data['sevenDaysMean'] / covid_data['population'] * 100000

    # some fixes of city names
    covid_data = covid_data.rename(index={
        'Salzburg Stadt': 'Salzburg',
        'Bruck an der Glocknerstraße': 'Bruck an der Großglocknerstraße',
        'Fusch an der Glocknerstraße': 'Fusch an der Großglocknerstraße',
        'Sankt Martin im Tennengebirge': 'Sankt Martin am Tennengebirge',
        'Hollersbach': 'Hollersbach im Pinzgau',
        'Rußbach am Pass Gschütt': 'Rußbach am Paß Gschütt'
    })

    plot_data = salzburg.join(covid_data)[['relativeActive', 'geometry']]
    plot_data.plot(column='relativeActive', figsize=(19.2, 10.8), legend=True, legend_kwds={'shrink': 0.8})
    plt.axis('off')
    plt.title('7-Tages-Mittel pro 100.000 Einwohner', fontsize=20)
    plt.suptitle('Stand: ' + last_updated.strftime('%d.%m.%Y %H:%m'))
    plt.savefig(report_dir + "aktiv.png")


if __name__ == '__main__':
    main()
