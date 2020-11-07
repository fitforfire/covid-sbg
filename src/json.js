const fs = require('fs');
const {loadData, getTowns, getDistricts} = require('./util');

const data = loadData();
const districts = getDistricts(data);

const json = {};
districts.forEach((d) => {
    json[d] = {};
    const towns = getTowns(data, d);
    towns.forEach((t) => {
        json[d][t] = {};
        ['gesamt', 'aktiv', 'genesen', 'verstorben'].forEach(type => {
            json[d][t][type] = {};
            data.forEach((entry) => {
                json[d][t][type][entry.meta.timestamp.update] = entry.data[d][t][type];
            });
        });
    });
});

fs.writeFileSync(`docs/report/gesamt.json`, JSON.stringify(json, null, 2));