# react-statex
### Yet Another State Flux/Redux Implementation

## What is this?
A way to easily manage global app state in React in a ES6+ friendly fashion. Instead of using higher-order components or wrapping components with state functions like found in `react-redux`, statex provides an extended component that provides the functionality for you. Using the `slices` mode of operation, you can break large apps into sub-state `slices` and only update components that use those slices. This way, global state change doesn't redraw every component in your app!

## Motivation?
I was getting tired of the very verbose (boilerplate) nature I was experiencing with `react-redux`/`redux` so decided to take my own attempt at it. Taking advantage of ES6+ classes seemed like a quick and easy way to do it, as well as using an event dispatching system without straying too far from flux itself. 

## Show me what you got!
```jsx
import StateX, {Component} from 'react-statex'

//Initialize StateX
StateX.initialize({
  //Options
}, {
  example: 1
  //Default state
})

//Create an Action Reducer
function exampleReducer(state, actionProps) {
  state.example += actionProps.amount
  return state
}
StateX.registerReducer('INCREMENT', exampleReducer)

//Component itself
class ExampleComponent extends Component {
  mapState = state => ({ value: state.example }) //Tells the component how to map the state
  render() {
    const { value } = this.state //Still using component state!
    return <div>
      <h1>{`Current Value: ${value}`}</h1>
      <button type='button' onClick={() => StateX.dispatchAction('INCREMENT', {amount: 2})}>Increment by 2</button>
    </div>
  }
}
```

StateX uses the already provided state mechanics of React components. It uses the provided `mapState` function to ask the component how to translate an incoming new state.

## Installation
Like all NPM packages this should get it done...

    npm install --save react-statex
    
Then in your code just import statex and extend your component from the provided component class

    import Statex, {Component} from 'react-statex'
    class YourComponent extends Component

If you still want the React component, feel free to alias whichever in the import statement

    import React, {Component} from 'react'
    import StateX, {Component as StateComponent} from 'react-statex'

Or just use `React.Component`

    import React from 'react'
    import StateX, {Component} from 'react-statex'
    class StateComponent extends Component { /*...*/ }
    class ReactComponent extends React.Component { /*...*/ }

## Basic Usage
Follow the **Show me what you got** section for a bare minimum example. There are only two options so far when initializing
 * `debug`: Turns on the `console.log` calls throughout the StateX system
 * `slices`: **VERY IMPORTANT** follow the next section for info on this

When using there are things to keep in mind:
 * State must be a POJSO or Plain 'Ol Object. So no functions in the state!
 * Action key's are `string` type!
 * Slice mode operates much faster for larger projects by breaking up the update logic
 
 ## Slices
To improve performance on large projects, I use a system of slices, or _state slices_. In the simplest terms they break the state into sub-states. This means modifying one sub-state, only updates the components that are _listening_ for that slice. This should keep draw calls lower.

Consider the following state:
```javascript
const state = {
  user: {
    name: 'John Smith'
  },
  notifications: {
    feed: [],
    unread: 0
  },
  messages: {
    feed: [],
    open: []
  }
}
```
Calling actions that modify the `notifications` slice here, will only update the components listening for updates on `notifications`. In order to achieve this slices mode, a _bit_ extra code is required...
 * Uses the `slices: true` option when initializing statex
 * When registering reducer, use a third parameter telling statex what slice this will modify. ie: `StateX.registerReducer('CLEAR_NOTIFS', reducerFunc, 'notifications')`
 * Use the `watching` property in your component with an array of slices it will listen for.

```jsx
//imports
StateX.initialize({ slices: true }, /*...*/)
StateX.registerReducer('ACTION_KEY', func, 'SLICE_KEY')
class Example extends Component {
  watching = ['SLICE_KEY']
}
```

## Caveats
In order to get the state event system to work, I've had to override a couple functions from `React.Component`. You can still use them, just make sure to call the `super.` versions in your new one so you don't loose functionality. There are only 2 overriden...

 * componentWillMount()
 * componentWillUnmount()

Example:
```jsx
class Example extends Component {
  componentWillMount() {
    super.componentWillMount()
    // Your code
  }
  componentWillUnmount() {
    super.componentWillUnmount()
    // Your code
  }
}
```

## Community Help
If you like this, or have suggestions for improvements or features **please let me know!**.
