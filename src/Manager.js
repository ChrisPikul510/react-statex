/**
 * Manages the state and interactions with Components
 */
import Component from './Component'

var _state = {}             //Empty state, holds the current global state
var _previousStateJson = '' //Cache's the last json stringified state

var _subs = new Map(),      //Manages the subscribers (components) by their subscription id as key
    _subIds = 0             //Tracks the id numbers (incremental)

var _watchers = {           //Watchers maps the slice key with an array of subscription id's that want events
    '*': []
}

var _actionLock = false,
    _actionQueue = []

/**
 * _reducers is a (complex?) map that tracks reducer functions with their appropriate action key
 * and slice key (or * if not using slices)
 * 
 * After registering a reducer with Manager.registerReducer the object looks like this:
 * _reducers = {
 *  'ACTION_KEY': [
 *      { slice: 'SLICE_KEY', reducer: reducerFunc() }
 *  ]
 * }
 * 
 * This way when an action is called, it first checks for the appropriate key listening for them,
 * then iterates the resulting array and calling each objects reducer function with the slice available
 * (or the whole state if it's a wildcard *)
 */
var _reducers = {}          //Reducers tracks actions key with function callbacks for action reducing

//Default options that the Manager will initialize with
const _defaultOptions = {
    debug: false,   //Enables logging events
    slices: false,  //True means slices are being used so only the "slices" are updated (recommended for larger states)
}

/**
 * Manages the global state
 * Provides the functions needed to interact and modify the state
 * This class/object is created as a singleton, so you do not need to instantiate one with "new Manager()"
 * by importing this class it's already running.
 * In order to initialize call the Manager.initialize() function as soon as possible
 */
class Manager {
    opts = _defaultOptions

    /**
     * Initializes the Manager and sets up the options and initial state object
     * @param {object?} options An object overriding the default options properties (optional)
     * @param {object?} initState Takes an initial state object to map with reducers (optional)
     */
    initialize(options = null, initState = {}, ) {
        if(options)
            this.opts = {..._defaultOptions, ...options}

        _state = JSON.parse(JSON.stringify(initState)) //NOTE: This may not be the best deep-clone

        this.opts.debug && console.log('[StateX] Initialized state', _state, this.opts)
    }

    /**
     * Subscribes a Component to the state using it's object and an array of
     * state slice keys for faster updating (hopefully).
     * If the watch array is empty a wildcard one (['*']) will be supplied which matches
     * any and all state slices
     * @param {Component} obj The stateful component object that's subscribing
     * @param [string] watching Array of strings to match with state  
     */
    subscribe(obj, watching = ['*']) {
        if(!obj || !(obj instanceof Component))
            throw new TypeError("Subscribe takes a parameter of Component type")

        if(!watching || !Array.isArray(watching))
            throw new TypeError("Subscribe's second paramter is an array, one will be provided if left empty")

        _subIds++
        let newId = _subIds
        let subscription = {
            id: newId,
            object: obj,
            watching
        }

        _subs.set(newId, subscription)

        watching.forEach(key => {
            if(_watchers.hasOwnProperty(key))
                _watchers[key].push(newId) //Add to watch listener
            else
                _watchers[key] = [newId]
        })

        //subscription.object.mapState(_state)

        this.opts.debug && console.log('[StateX] Subscribed object', newId, subscription)
        return newId
    }

    /**
     * Unsubscribes a component from the state updates
     * @param {number} id Subscription ID returned from Manager.subscribe
     */
    unsubscribe(id) {
        if(!id || !Number.isInteger(id))
            throw new TypeError("Unsubscribe takes the subscription id from Component")

        if(_subs.has(id)) {
            const sub = _subs.get(id)
            sub.watching.forEach(key => {
                for(let i=0; i < _watchers[key].length; i++) {
                    if(_watchers[key][i] == sub.id) {
                        _watchers[key].splice(i, 1)
                        break
                    }
                }
            })
            _subs.delete(id)

            console.log(_watchers)
        } else {
            this.opts.debug && console.warn('[StateX] Unsubscribe called with an id that does not exist, ID=%d', id)
            return false
        }
    }

    /**
     * Registers a reducer function to it's appropriate action key
     * If using slices, a slice key must be provided as a third argument
     * If not using slices (default), then no third argument can be applied
     * @param {string} actionKey Action to listen for
     * @param {function} reducer Function to call on action. Will be supplied the current state slice (or whole) and must return a new object
     * @param {string?} sliceKey Slice key that this reducer applies to. Defaults to *, which is not used if using slices
     */
    registerReducer(actionKey, reducer, sliceKey = '*') {
        if(typeof actionKey !== 'string')
            throw new TypeError('registerReducer must take a string action key as it\'s first parameter')
        if(typeof reducer !== 'function')
            throw new TypeError('registerReducer must take a function as it\'s second parameter')
        if(typeof sliceKey !== 'string')
            throw new TypeError('registerReducer must take a string slice key as it\'s third parameter')

        /*
        if(sliceKey === '*' && this.opts.slices)
            throw new Error('When using slices, registerReducer cannot use the default wildcard')
        else if(sliceKey !== '*' && !this.opts.slices)
            throw new Error('When not using slices, registerReducer can only be used with "*". Better to leave the third parameter off so it defaults')
        */

        if(_reducers.hasOwnProperty(actionKey)) {
            _reducers[actionKey].push({
                slice: sliceKey,
                reducer
            })
        } else {
            _reducers[actionKey] = [{
                slice: sliceKey,
                reducer
            }]
        }

        this.opts.debug && console.log('[StateX] Registered reducer for action "%s" and optional slice "%s"', actionKey, sliceKey)
    }

    dispatchAction(actionKey, props = null) {
        /*
        Promise.resolve().then(() => {
            if(_actionLock) {
                _actionQueue.push({ key: actionKey, props })
                this.opts.debug && console.log('[StateX::dispatchAction] Action is being processed, queing up')
            } else {
                _actionLock = true
                this.processAction(actionKey, props)
            }
        })
        */
        
        return new Promise((resolve, reject) => {
            if(_actionLock) {
                _actionQueue.push({ key: actionKey, props })
                this.opts.debug && console.log('[StateX::dispatchAction] Action is being processed, queing up')
            } else {
                _actionLock = true
                this.processAction(actionKey, props)
            }
            resolve()
        })
        
    }

    processAction(actionKey, props = null) {
        this.opts.debug && console.log('[StateX::processAction] Dispatching action', actionKey, props)
        let perf = 0
        if(this.opts.debug && performance)
            perf = performance.now()
       
        //NOTE: Consider normalizing the action key by upper casing it (performance hit?)
        if(typeof actionKey !== 'string')
            throw new TypeError('dispatchAction requires a string as the action key')
        
        if(!_reducers.hasOwnProperty(actionKey))
            return console.warn('[StateX::processAction] No active reducers are listening for the provided action: %s', actionKey)
        
        let state = {}
        let modifiedSlices = {}
        let reducers = _reducers[actionKey]
        if(this.opts.slices) {
            //Using slices, so get them individually from the state
            for(let i=0; i < reducers.length; i++) {
                const rdcr = reducers[i]

                const slice = _state[rdcr.slice]
                if(typeof slice !== 'object') {
                    this.opts.debug && console.warn('[StateX::processAction] Did not find a correct (or possibly any) slice with the given key "%s". Check that the slice is an object', rdcr.slice)
                    continue
                }

                const newSlice = rdcr.reducer(slice, props)
                if(typeof newSlice !== 'object') {
                    this.opts.debug && console.warn('[StateX::processAction] A reducer did not return an object when called. Action=%s, Slice=%s, Returned Type=%s', actionKey, rdcr.slice, typeof newSlice)
                    continue
                }

                state[rdcr.slice] = newSlice

                if(!modifiedSlices[rdcr.slice])
                    modifiedSlices[rdcr.slice] = true
            }
        } else {
            //Not using slices, so each just get the whole thing
            for(let i=0; i < reducers.length; i++) {
                const rdcr = reducers[i]
                const newState = rdcr.reducer(_state, props)
                if(newState.constructor !== Object) {
                    this.opts.debug && console.warn('[StateX::processAction] A reducer did not return an object when called. Action=%s, Returned Type=%s', actionKey, typeof newState)
                    continue
                }

                state = newState
            }
        }

        this.opts.debug && performance && console.log('[StateX::processAction] Reducers completed, updating state. Performance: %fms', performance.now()-perf)

        this._updateState(state)
    }

    _updateState(obj = {}) {
        var perf = 0
        if(this.opts.debug && performance) //Optional debug performance
            perf = performance.now()
        
        const newState = Object.assign({}, _state, obj)

        //JSON Stringify so it turns into easily comparible text
        //if this matches the last cached json string then the state is the same
        const stateJson = JSON.stringify(newState)
        if(stateJson === _previousStateJson) {
            this.opts.debug && console.log('[StateX] State was the same, returning early')
            this._checkQueue()
            return;
        }
        _previousStateJson = stateJson
        _state = newState

        this.opts.debug && performance && console.log('[StateX] State is modified and ready for updates. Performance: %fms', performance.now() - perf)

        if(this.opts.slices) {
            //Iterate the keys in the state.
            //This is what I mean by "slices". Each property is treated like a sub-state
            //The _watchers array contains key-value pairs for the slice keys
            //If there's matching watchers, it means someone is listening for this update
            let updating = []
            for(let key in obj) {
                if(_watchers.hasOwnProperty(key)) {
                    _watchers[key].forEach(comp => {
                        let alreadyChecked = false
                        for(let i=0; i < updating.length; i++) {
                            if(updating[i] == comp) {
                                alreadyChecked = true
                                break;
                            }
                        }
                        if(!alreadyChecked)
                            updating.push(comp)
                    })
                }
            }

            //Check wildcard watcher
            //Wildcard is the default and means to watch everything
            _watchers['*'].forEach(comp => {
                let alreadyChecked = false
                for(let i=0; i < updating.length; i++) {
                    if(updating[i] == comp) {
                        alreadyChecked = true
                        break;
                    }
                }
                if(!alreadyChecked)
                    updating.push(comp)
            })

            //With our formed list of components that want updates, we can issue it now.
            updating.forEach(comp => {
                if(_subs.has(comp)) {
                    _subs.get(comp).object._updateState(newState)
                }
            })
        } else {
            //We are not using slices so every component is treated as wildcard regardless of settings
            //Basically, we're giving everyone the whole new state
            _subs.forEach(sub => sub.object._updateState(newState))
        }

        if(this.opts.debug) {
            if(performance) {
                perf = performance.now() - perf
                console.log('[StateX::updateState] Completed state update. Performance: %fms', perf)
            } else {
                 console.log('[StateX::updateState] Completed state update')
            }
        }

        this._checkQueue()
    }

    _checkQueue() {
        if(_actionQueue.length > 0) {
            let action = _actionQueue.shift()
            this.processAction(action.key, action.props)
        } else
            _actionLock = false
    }

    /**
     * Current global state object
     */
    get state() { return _state }
}

const _Manager = new Manager()
export default _Manager
