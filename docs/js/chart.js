const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#000000'];

const typeColors = {
    'gesamt': '#ffe119',
    'aktiv': '#e6194b',
    'genesen': '#3cb44b',
    'verstorben': '#000000'
}

function isMobile() {
    return window.innerWidth < 980;
}

let chart;

function destroyAndRestore(id, datasets) {
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: datasets[0].data.map(d => d.x.split("T")[0]),
            datasets
        },
        options: {
            legend: {
                position: isMobile() ? 'bottom' : 'left'
            },
            aspectRatio: isMobile() ? 0.5 : 2
        }
    });
}

function buildOverviewChart(districts, type, population, showRelativeValues = false) {
    const datasets = [];
    Object.keys(districts).forEach((district, i) => {
        const data = [];
        Object.keys(districts[district][district][type]).map((date, x) => {
            let y = parseInt(districts[district][district][type][date]);
            y = showRelativeValues ? Math.round(y / population[district] * 100000) : y;
            data.push({
                x: date,
                y
            });
        });
        datasets.push({
            label: district,
            data: data,
            borderColor: colors[i % colors.length],
            backgroundColor: 'transparent',
            hidden: false,
        })
    });

    destroyAndRestore('overview', datasets);
}

function buildDistrictChart(towns, district, type, population, showRelativeValues = false) {
    const datasets = [];
    Object.keys(towns).forEach((town, i) => {
        const data = [];
        Object.keys(towns[town][type]).map((date, x) => {
            let y = parseInt(towns[town][type][date]);
            y = showRelativeValues ? Math.round(y / population[town] * 100000) : y;
            data.push({
                x: date,
                y
            });
        });
        datasets.push({
            label: town,
            data: data,
            borderColor: colors[i % colors.length],
            backgroundColor: 'transparent',
            hidden: false,
        })
    });
    if (district !== 'Salzburg Stadt') {
        datasets[0].hidden = true;
    }

    destroyAndRestore(district, datasets);
}


function buildTownChart(town, id) {
    const datasets = [];
    Object.keys(town).forEach((type, i) => {
        const data = [];
        Object.keys(town[type]).map((date, x) => {
            data.push({
                x: date,
                y: parseInt(town[type][date])
            });
        });
        datasets.push({
            label: type,
            data: data,
            borderColor: typeColors[type],
            backgroundColor: 'transparent',
            hidden: false,
        })
    });

    destroyAndRestore(id, datasets);
}