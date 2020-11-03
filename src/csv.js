const fs = require('fs');
const {loadData, getTowns, getDistricts, getRow, getTimestamps} = require('./util');

const data = loadData();
const districts = getDistricts(data);

function toCSV(rows) {
    return rows.map(row => row.join("\t")).join("\n");
}

function getRows(type = 'aktiv') {
    const rows = [["Gemeinde", ...getTimestamps(data)]];
    districts.forEach(d => {
        const towns = getTowns(data, d);
        towns.forEach(t => {
            rows.push([d + " / " + t, ... getRow(data, d, t).map(d => d[type])])
        });
    });
    return rows;
}

['gesamt', 'aktiv', 'genesen', 'gestorben'].forEach(type => {
    const csv = toCSV(getRows(type));
    fs.writeFileSync(`report/${type}.csv`, csv);
});
