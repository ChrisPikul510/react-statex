/**
 * Testing entry point for the project
 */
import React from 'react'
import ReactDOM from 'react-dom'

import StateX, {Component} from '../index'

import GridExample from './GridExample'

const render = Component => ReactDOM.render(Component, document.getElementById('root'))

//Registers the state manager for everyone's use. Do this ASAP to make sure the options
//and default state are setup.
StateX.initialize({
    debug: false,
    slices: true
}, {
    test: {
        value: 0
    },
    grid: {
        colors: []
    }
})

//Create a reducer
//Use any flavour of function syntax you want just make sure it returns an object matching
//the state. It will not merge properties, so whatever is returned is what the state will be
const reducer = state => {
    state.value = state.value + 1
    return state
}
StateX.registerReducer('INCREMENT', reducer, 'test') //This registers this reducer to the 'INCREMENT' action

//Simple example component, notice the "extends StateComponent" instead of traditional React.Component
class Test extends Component {
    renders = 0;
    watching = ['test']

    //Statex operates on the state of the component, so whatever is in here will be overriden
    //at the same time, it's important to NOT change these values with this.setState() as that
    //will throw your state off track with the global one.
    state = {
        value: 0
    }

    //Required! This function takes the incoming state and returns an object with the mappings
    //from global state properties to this components local state properties.
    //This example shows the purest way this can be done, but this can also be written as the example
    //comment below it illustrates.
    mapState = state => ({ value: state.test.value })
    /*
    mapState(state) {
        return {
            value: state.value
        }
    }
    */

    render() {
        this.renders++;
        return <div>
            <h1>Test Component</h1>
            <h3>Value: {this.state.value}</h3>
            <h4>Renders: {this.renders}</h4>
        </div>
    }
}

class ShowHide extends Component {
    watching = ['test']
    mapState = state => ({ value: state.test.value })
    state = {
        value: 0
    }

    render() {
        return <div>{this.state.value}</div>
    }
}

let showing = false

class View extends React.Component {
    state = {
        showing: false
    }

    render() {
        const { showing } = this.state
        return <div>
            {/* This button issues the 'INCREMENT' action */}
            <button type='button' onClick={() => StateX.dispatchAction('INCREMENT')}>UPDATE</button>
            <Test />
            <button type='button' onClick={() => this.setState({ showing: !showing })}>Show/Hide</button>
            {showing==true && <ShowHide />}
            {<GridExample />}
        </div>
    }
}

render(<View />)

if(module.hot) 
    module.hot.accept('./', () => render(view))
