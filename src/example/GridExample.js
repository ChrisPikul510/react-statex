import React, {Component as RCTComponent} from 'react'
import StateX, {Component} from '../index'

const numberOfObjects = 1000

const reducer = state => {
    let clrs = []
    for(let i=0; i < numberOfObjects; i++) {
        clrs.push(getRandomColor())
    }
    state.colors = clrs
    return state
}
StateX.registerReducer('CHANGE_GRID', reducer, 'grid')

export default class GridExample extends RCTComponent {
    componentWillMount() {
        let defColors = []
        for(let i=0; i < numberOfObjects; i++) {
            defColors.push(getRandomColor())
        }

        StateX._updateState({
            ...StateX.state,
            grid: {
                colors: defColors
            }
        })
    }

    render() {
        return <div>
            <h1>Grid Example</h1>
            <button onClick={() => this.act()}>Randomize!</button><br />
            <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
                { this.renderGrid() }
            </div>
        </div>
    }

    renderGrid() {
        let objs = []
        for(let i=0; i < numberOfObjects; i++) {
            objs.push(<GridItem key={i} colorIndex={i} />)
        }
        return objs
    }

    act = () => StateX.dispatchAction('CHANGE_GRID')
}

class GridItem extends Component {
    watching = ['grid']
    
    state = {
        color: '#000000'
    }

    mapState = state => ({
        color: state.grid.colors[this.props.colorIndex]
    })

    render = () => <span style={{backgroundColor: this.state.color, width: '2vw', height: '2vw', display: 'inline-block'}} />
}


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}