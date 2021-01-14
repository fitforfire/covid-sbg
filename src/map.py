import json
from datetime import datetime

import contextily as ctx
import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd

map_zip = "zip://./src/Salzburg.zip!Salzburg_BEV_VGD_250_LAM.shp"
report_dir = "./docs/report/"


def main():
    # get Up to date covid Data
    raw_data = pd.read_csv(report_dir + 'aktiv.csv').set_index('Gemeinde')
    last_updated = datetime.strptime(raw_data.columns[-1], "%Y-%m-%dT%H:%M:%S.%fZ")

    # create df
    covid_data = pd.DataFrame(index=raw_data.index)
    covid_data['active'] = raw_data.iloc[:, -1:]
    covid_data['activeYesterday'] = raw_data.iloc[:, -2:-1]

    # add deaths
    death_data = pd.read_csv(report_dir + 'verstorben.csv').set_index('Gemeinde')
    covid_data['death'] = death_data.iloc[:, -1:]

    # get Population for relative numbers
    with open(report_dir + "population.json") as population_file:
        population = json.load(population_file)
    population = pd.DataFrame(population, index=["population"])

    # some fixes of uncategorized population
    population['Flachgau - Nicht zugeordnet'] = population['Flachgau']
    population['Tennengau - Nicht zugeordnet'] = population['Tennengau']
    population['Pongau - Nicht zugeordnet'] = population['Pongau']
    population['Pinzgau - Nicht zugeordnet'] = population['Pinzgau']
    population['Lungau - Nicht zugeordnet'] = population['Lungau']
    population['Stadt Salzburg - Nicht zugeordnet'] = population['Salzburg Stadt']

    covid_data = covid_data.join(population.transpose())
    covid_data['population'] = covid_data['population'].fillna(0).astype(int)

    covid_data['relativeActive'] = covid_data['active'] / covid_data['population'] * 100000
    covid_data['relativeActiveYesterday'] = covid_data['activeYesterday'] / covid_data['population'] * 100000
    covid_data['relativeActiveChange'] = covid_data['relativeActive'] - covid_data['relativeActiveYesterday']

    create_table(covid_data)
    plot_map(covid_data, last_updated)


def color_red_green(val):
    color = '#d65f5f' if val > 0 else 'transparent' if val == 0 else '#104a10'

    return 'color: %s' % color


def create_table(data):
    table = data[['relativeActive', 'relativeActiveChange', 'death', 'population']].sort_index()

    table.rename(inplace=True, columns={
        'relativeActive': 'Aktive Fälle <wbr>pro 100.000 EW',
        'relativeActiveChange': 'Δ aktive Fälle <wbr>pro 100.000 EW',
        'death': 'Verstorben',
        'population': 'Bevölkerung',
    })

    html = table.style \
        .applymap(color_red_green, subset=table.columns[1]) \
        .format("{:+.0f}", subset=table.columns[1]) \
        .bar(subset=table.columns[0], align='mid', color='#5fba7d') \
        .bar(subset=table.columns[1], align='zero', color=['#5fba7d', '#d65f5f']) \
        .bar(subset=table.columns[2], align='zero', color='#4d4d4d') \
        .set_precision(0) \
        .set_uuid('') \
        .render()

    with open(report_dir + "table.html", 'w') as f:
        f.write(html)


def plot_map(data, last_updated):
    # get map
    salzburg = gpd.read_file(map_zip)
    # simplify districts
    salzburg = salzburg.dissolve(by='PG')

    # some fixes of city names for map
    data.rename(inplace=True, index={
        'Salzburg Stadt': 'Salzburg',
        'Bruck an der Glocknerstraße': 'Bruck an der Großglocknerstraße',
        'Fusch an der Glocknerstraße': 'Fusch an der Großglocknerstraße',
        'Sankt Martin im Tennengebirge': 'Sankt Martin am Tennengebirge',
        'Hollersbach': 'Hollersbach im Pinzgau',
        'Rußbach am Pass Gschütt': 'Rußbach am Paß Gschütt'
    })

    plot_data = salzburg.join(data)[['relativeActive', 'geometry']].to_crs(epsg=3857)

    ax = plot_data.plot(
        column='relativeActive',
        cmap='Paired',
        figsize=(14, 10.5),
        legend=True,
        legend_kwds={'shrink': 0.8, 'alpha': 0.5},
        alpha=0.5,
        edgecolor='k',
    )
    ctx.add_basemap(ax, source=ctx.providers.Stamen.TonerLite)
    plt.axis('off')
    plt.title('Aktive Fälle pro 100.000 Einwohner', fontsize=20)
    plt.suptitle('zivilschutz.at\nStand: ' + last_updated.strftime('%d.%m.%Y %H:%m'), y=0.95)
    plt.savefig(report_dir + "aktiv.png")


if __name__ == '__main__':
    main()
