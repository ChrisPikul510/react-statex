import React from 'react'
import Manager from './Manager'

export default class Component extends React.Component {
    _subId = 0
    watching = ['*']

    constructor() {
        super()

        //Register with the state manager
        //this._subId = Manager.subscribe(this, this.getWatching()) //caution, this may upset the mounted/unmounted phase
    }

    componentWillMount() {
        this._subId = Manager.subscribe(this, this.watching)
        this._updateState(Manager.state)
    }
    
    componentWillUnmount() {
        Manager.unsubscribe(this._subId)
    }

    mapState = state => ({})

    _updateState(newState) {
        let mapped = this.mapState(newState)
        this.setState({...mapped})
    }
}