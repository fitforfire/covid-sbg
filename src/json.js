const fs = require('fs');
const {loadData, getTowns, getDistricts} = require('./util');

const data = loadData();
const districts = getDistricts(data);

function getTimesampt(daysOffset) {
    const d = new Date();
    return d.setDate(d.getDate() + daysOffset);
}


const report = {
    'gesamt': {},
    't14': {},
    't30': {}
};
districts.forEach((d) => {
    report['gesamt'][d] = {};
    report['t14'][d] = {};
    report['t30'][d] = {};
    const towns = getTowns(data, d);
    towns.forEach((t) => {
        report['gesamt'][d][t] = {};
        report['t14'][d][t] = {};
        report['t30'][d][t] = {};
        ['gesamt', 'aktiv', 'genesen', 'verstorben'].forEach(type => {
            report['gesamt'][d][t][type] = {};
            report['t14'][d][t][type]  = {};
            report['t30'][d][t][type]  = {};
            data.forEach((entry) => {
                report['gesamt'][d][t][type][entry.meta.timestamp.update] = entry.data[d][t][type];
                if (Date.parse(entry.meta.timestamp.update) > getTimesampt(-14)){
                    report['t14'][d][t][type][entry.meta.timestamp.update] = entry.data[d][t][type];
                }
                if (Date.parse(entry.meta.timestamp.update) > getTimesampt(-30)){
                    report['t30'][d][t][type][entry.meta.timestamp.update] = entry.data[d][t][type];
                }
            });
        });
    });
});

fs.writeFileSync(`docs/report/gesamt.json`, JSON.stringify(report.gesamt, null, 2));
fs.writeFileSync(`docs/report/t14.json`, JSON.stringify(report.t14, null, 2));
fs.writeFileSync(`docs/report/t30.json`, JSON.stringify(report.t30, null, 2));