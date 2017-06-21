import React from 'react'
import Manager from './Manager'

export default class Component extends React.Component {
    _subId = 0
    watching = ['*']

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