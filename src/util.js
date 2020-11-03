const fs = require('fs');

function getTimestamps(data) {
    return data.map(d => d.meta.timestamp.update);
}

function getRow(data, district, town) {
    return data.map(d => d.data[district][town]);
}

function getDistricts(data) {
    return Object.keys(data[0].data);
}

function getTowns(data, district) {
    return Object.keys(data[0].data[district]);
}

function loadData() {
    const dataFolder = './data/';
    const data = [];
    fs.readdirSync(dataFolder).forEach(file => {
        if (file.endsWith(".json")) {
            const json = JSON.parse(fs.readFileSync(dataFolder + file));
            data.push(json);
        }
    });
    return data;
}

module.exports = {
    loadData,
    getTowns,
    getDistricts,
    getRow,
    getTimestamps
};