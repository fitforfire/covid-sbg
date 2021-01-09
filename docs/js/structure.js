const {Component, h, render} = window.preact;
const {Router, Route, Link} = window.preactRouter;
const {createHashHistory} = window.History;

const getLink = ({district, town, showRelativeValues}) => {
    let link = '';
    if (district) {
        link += `/district/${district}`;
    }
    if (town) {
        link += `/town/${town}`;
    }
    if (!town && showRelativeValues) {
        link += '/relative'
    }
    if (link === '') {
        return '/';
    }
    return link;
}

const TownNav = (props) => {
    return (h('div', {},
        h('h3', {}, "Details für Gemeinden:"),
        h('nav', {}, h('div', {className: 'pure-button-group', role: 'group'},
            props.towns.map(town => (h(Link, {href: getLink({district: props.district, town, showRelativeValues: props.showRelativeValues})}, h('button', {className: `pure-button${props.active === town ? ' pure-button-active' : ''}` }, town))))
        ))
    ));
}

const ModeNav = ({district, town, showRelativeValues}) => {
    return h('div', {},
            h('h3', {}, 'Zahlenmodus'),
            h('nav', {}, h('div', {className: 'pure-button-group', role: 'group'},
            h(Link, {href: getLink({district, town})}, h('button', {className: `pure-button${!showRelativeValues ? ' pure-button-active' : ''}` }, 'Absolute Zahlen')),
            h(Link, {href: getLink({district, town, showRelativeValues: true})}, h('button', {className: `pure-button${showRelativeValues ? ' pure-button-active' : ''}` }, 'Relative Zahlen'))
        )
    ))
}

const DistrictNav = ({active, showRelativeValues}) => {
    const districts = ['Flachgau', 'Lungau', 'Pinzgau', 'Pongau', 'Tennengau', 'Salzburg Stadt']
    return h('div', {},
        h('h2', {}, 'Bezirk auswählen'),
        h('nav', {}, h('div', {className: 'pure-button-group', role: 'group'},
            h(Link, {href: getLink({showRelativeValues})}, h('button', {className: `pure-button${active === undefined ? ' pure-button-active' : ''}` }, 'Übersicht')),
            districts.map(d => h(Link, {href: getLink({district: d, showRelativeValues})}, h('button', {className: `pure-button${active === d ? ' pure-button-active' : ''}` }, d))),
        ))
    );
}



class District extends Component {

    buildChart() {
        buildDistrictChart(this.props.timeseries[this.props.district], this.props.district, 'aktiv', this.props.population, this.props.showRelativeValues);
    }

    componentDidMount() {
        this.buildChart();
    }

    componentDidUpdate() {
        this.buildChart();
    }

    render(props, state) {
        const towns = this.props.timeseries && Object.keys(this.props.timeseries[props.district]);
        return (
            h('section', {},
                h(DistrictNav, {active: props.district, showRelativeValues: props.showRelativeValues}),
                h(ModeNav, {district: props.district, showRelativeValues: props.showRelativeValues}),
                h('h2', {}, props.showRelativeValues ? `Aktive Fälle pro 100.000 Einwohner für ${props.district}` : `Aktive Fälle ${props.district}`),
                h('canvas', {id: props.district}),
                h(TownNav, {towns, district: props.district, showRelativeValues: props.showRelativeValues})
            )
        )
    }
}

class Town extends Component {

    buildChart() {
        buildTownChart(this.props.timeseries[this.props.district][this.props.town], "city");
    }

    componentDidMount() {
        this.buildChart();
    }

    componentDidUpdate() {
        this.buildChart();
    }

    render(props, state) {
        const towns = this.props.timeseries && Object.keys(this.props.timeseries[props.district]);
        return (
            h('section', {},
                h(DistrictNav, {active: props.district}),
                h('h2', {}, `Details für ${props.town}`,
                    h('span', {class: 'population'}, ` (${props.population[props.town]} Einwohner)`)
                ),
                h('canvas', {id: 'city'}),
                h(TownNav, {towns, district: props.district, active: props.town})
            )
        )
    }
}

class Overview extends Component {

    buildChart() {
        buildOverviewChart(this.props.timeseries, "aktiv", this.props.population, this.props.showRelativeValues);
    }

    componentDidMount() {
        this.buildChart();
    }

    componentDidUpdate() {
        this.buildChart();
    }

    render(props, state) {
        return (
            h('section', {},
                h(DistrictNav, {showRelativeValues: props.showRelativeValues}),
                h(ModeNav, {district: props.district, showRelativeValues: props.showRelativeValues}),
                h('h2', {}, props.showRelativeValues ? `Aktive Fälle pro 100.000 Einwohner pro Bezirk` : `Aktive Fälle pro Bezirk`),
                h('canvas', {id: 'overview'}),
                h('img', {src: 'report/aktiv.png', id: 'sbgMap'}),
                h('div', {id: 'dataTable', dangerouslySetInnerHTML: {__html: this.props.table}}),
            )
        )
    }
}

class Main extends Component {
    componentDidMount() {
        Promise.all([
            fetch("./report/gesamt.json").then(response => response.json()),
            fetch("./report/population.json").then(response => response.json()),
            fetch("./report/table.html").then(response => response.text()),
        ]).then(([timeseries, population, table]) => {
            this.setState({
                timeseries, population, table
            });
        })
    }

    handleRoute(e) {
        _paq.push(['setCustomUrl', e.url]);
        _paq.push(['trackPageView']);
    };

    render() {
        return (h('div', {},

            this.state.timeseries && h(Router, {history: createHashHistory(), onChange: this.handleRoute},
            h(Town, {path: '/district/:district/town/:town', timeseries: this.state.timeseries, population: this.state.population, showRelativeValues: false}),
            h(District, {path: '/district/:district', timeseries: this.state.timeseries, population: this.state.population, showRelativeValues: false}),
            h(District, {path: '/district/:district/relative', timeseries: this.state.timeseries, population: this.state.population, showRelativeValues: true}),
            h(Overview, {path: '/relative', timeseries: this.state.timeseries, population: this.state.population, table: this.state.table, showRelativeValues: true}),
            h(Overview, {default: true, timeseries: this.state.timeseries, population: this.state.population, table: this.state.table, showRelativeValues: false}),
            )));
    }
};

document.addEventListener("DOMContentLoaded", function (event) {
    render(h(Main), document.getElementById('preact'));
});
