const {Component, h, render} = window.preact;
const {Router, Route, Link} = window.preactRouter;
const {createHashHistory} = window.History;

const TownNav = (props) => {
    return (h('div', {},
        h('h3', {}, "Details für Gemeinden:"),
        h('nav', {}, props.towns.map(town => (h(Link, {href: `/district/${props.district}/town/${town}`}, town))))
    ));
}

const DistrictNav = (props) => {
    return h('div', {},
        h('h2', {}, 'Bezirk auswählen'),
        h('nav', {},
            h(Link, {href: '/district/Lungau'}, 'Lungau'),
            h(Link, {href: '/district/Pinzgau'}, 'Pinzgau'),
            h(Link, {href: '/district/Pongau'}, 'Pongau'),
            h(Link, {href: '/district/Tennengau'}, 'Tennengau'),
            h(Link, {href: '/district/Salzburg Stadt'}, 'Salzbug Stadt')
        )
    );
}

class District extends Component {

    buildChart() {
        buildDistrictChart(this.props.gesamt, this.props.district, 'aktiv');
    }

    componentDidMount() {
        this.buildChart();
    }

    componentDidUpdate() {
        this.buildChart();
    }

    render(props, state) {
        const towns = this.props.gesamt && Object.keys(this.props.gesamt[props.district]);
        return (
            h('section', {},
                h(DistrictNav, {}),
                h('h2', {}, `Aktive Fälle ${props.district}`),
                h('canvas', {id: props.district}),
                h(TownNav, {towns, district: props.district})
            )
        )
    }
}

class Town extends Component {

    buildChart() {
        buildTownChart(this.props.gesamt[this.props.district][this.props.town], "city");
    }

    componentDidMount() {
        this.buildChart();
    }

    componentDidUpdate() {
        this.buildChart();
    }

    render(props, state) {
        const towns = this.props.gesamt && Object.keys(this.props.gesamt[props.district]);
        return (
            h('section', {},
                h(DistrictNav, {}),
                h('h2', {}, `Details für ${props.town}`),
                h('canvas', {id: 'city'}),
                h(TownNav, {towns, district: props.district})
            )
        )
    }
}

class Main extends Component {
    componentDidMount() {
        fetch("./report/gesamt.json").then(response => response.json()).then(gesamt => {
            this.setState({
                gesamt
            });
        });
    }

    render() {
        return (h('div', {},

            this.state.gesamt && h(Router, {history: createHashHistory()},
            h(Town, {path: '/district/:district/town/:town', gesamt: this.state.gesamt}),
            h(District, {path: '/district/:district', gesamt: this.state.gesamt}),
            h(DistrictNav, {default: true})
            )));
    }
};

document.addEventListener("DOMContentLoaded", function (event) {
    render(h(Main), document.getElementById('preact'));
});
