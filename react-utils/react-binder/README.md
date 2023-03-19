# React Binder


## Overview
React Binder is an utility to create a binded state that sets the state automatically with every change.


## Installation
Install to your NodeJS project using [npm](https://npmjs.org/nelson-react-binder).
```bash
npm install nelson-react-binder --save
```

## API
## `ComponentStateBinder` namespace
### `ComponentStateBinder.create<P extends {}, S extends {}>()`
This method provides the necesary functionality that allows to create a BindedState object that can be used instead of the regular `Component.state` which automatically updates the state of your component when you perform changes to the binded state 

> ### Function definition
```typescript
    /**
     * Creates a Binded state for the type {@link TState} of a Component State which allows 
     * you to modify and update the state as the properties of the state has been updated.
     * 
     * @param {React.Component} component   React Component to create the Binded State from.
     * @param {BindingOptions}  options     Additional options to configure the binder.
     * 
     * @returns {@link Binded<TState>} for the {@link React.Component}.
     */
    export function create<TProps, TState extends {}>(
        component: React.Component<TProps, TState>,
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): Binded<TState> 
```

#### Parameters of `ComponentStateBinder.create<TP extends {}, S extends {}>()`
|Name               | Description|
|         -         |   -   |
|***TProps***       | Type of the Component properties|
|***TState***       | Type of the Component state|
|__component__      | React Component to create the Binded State|
|__options__        | Additional options to configure the binder behavior.|


## `StateBinder` namespace
### `StateBinder.create<TState extends {}>()`
This method provides the necesary functionality that allows to create a BindedState object that can be used instead of the regular `state` which automatically updates the state of your component when you perform changes to the binded state. 
> WARNING: DO NOT use as part of the `React.Component` class declaration as the `setState()` gets replaced at run time.

> #### Function definition
```typescript
    /**
     * Creates a {@link Binded} state based on the passed state which call setState call for every change.
     * 
     * DO NOT use when declaring the a variable in the {@link React.Component} class as
     * the setSate gets replaced after declared. Use the {@link ComponentBinder.create()}
     * function instead as it handles this case.
     * 
     * @param {TState}          state           React state variable to use
     * @param {Function}        setStateFunc    Function pass the state once there is a change to the BindedState
     * @param {BindingOptions}  options         Additional options to configure the state binder.
     * 
     * @returns {@link Binded<T>} for {@link React.Component}.
     */
    export function create<TState extends {}>(
        state: TState,
        setStateFunc: SetStateFunc<TState>,
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): Binded<TState> 
```

#### Parameters of `StateBinder.create<P extends {}, S extends {}>()`
|Name               | Description|
|         -         |   -   |
|***TState***       | Type of the passed state parameter|
|__state__          | State to keep perform be tracked by the BindedState object.|
|__options__        | Additional options to configure the binder behavior.|



## `BindingOptions` type
The `BindingOptions` is a parameter used to change the behavior of the Binder rught now it only supports to `updateState` and `cloningOptions`.

### Definition of the `BindingOptions`
```typescript
/**
 * Binding Options to confgure the binding between the state
 * 
 * @property whenShouldSetState     Determines if the state should be updated only when are changes or allways no matter if the value is the same.
 * @property clonningOption         Determines the cloning method to use for the state either shallow or deep copy.
 */
export type BindingOptions = {
    whenShouldSetState?: 'allways' | 'onlyOnChanges',
    cloningOption?: "deep" | "shallow"
};

// Default value of the options if not presented
const DEFAULT_BINDING_OPTIONS: BindingOptions = { whenShouldSetState: 'onlyOnChanges', cloningOption: "shallow" };

```

### `whenShouldSetState`:
When assigning a value to a `BindedState` object it could call `setState()` function which is either "allways" even if the value doesn't change or "onlyOnChange" which only sets the state if setting the value is different from the original.

### `cloningOption`:
When cloning the state there are two options either perform a `deep` or `shallow` copy of the state.

#### Properties  of `BindingOptions`:
|Name                       | Type                          | Default               |Description |
|         -                 |               -               |       -               |     -      |
|__whenShouldSetState__     | "allways" or "onlyOnChanges"  |   "onlyOnChanges"     | When assigning a value to a `BindedState` object it could call `setState()` function which is either "allways" even if the value doesn't change or "onlyOnChange" which only sets the state if setting the value is different from the original.|
|__cloningOption__          | "deep" or "shallow"           |   "shallow"           | When cloning the state there are two options either perform a `deep` copy or a `shallow` copy of the state.|


## Examples
This and any additonal examples should be under [Examples](https://github.com/nelson-perez/nelson/tree/main/react-utils/react-binder/examples)
```tsx
import React from 'react';

import { ComponentStateBinder, isBinded, Binded } from 'nelson-react-binder';

type IState = {
    level1: string,
    level2: { level2_1: string }
};

export default class App extends React.Component<{}, any> {
    state: any = {level1: 'level1', level2: {level2_1: "level2.level2_1"}};
    binded: Binded<any> = ComponentStateBinder.create(this);

    // Input change handler
    handleChange_replacePrimitive = (event: any) => {
        // Get input value from "event"
        const value = event.target.value;

        // Updating the primitives
        this.binded.level1 = "primitive-1 " + value;
        this.binded.level2.level2_1 = "primitive-2_1 " + value;
    };
      
    // Input change handler
    handleChange_objectReplacement = (event: any) => {
        // Get input value from "event"
        const value = event.target.value;

        // Replacing the level2 object and setting the level1 value to <primititve-1>
        this.binded.level1 = '<primitive-1>';
        this.binded.level2 = {
            level2_1: "replaceObject-2_1: " + value
        };
    };
    
    // Input change handler
    handleChange_update = (event: any) => {
        // Get input value from "event"
        const value = event.target.value;

        // Perform multiple updates within a single setState call
        this.binded.update((b: any) => {
            b.level1 = "bulkUpdate-1: " +  value;
            b.level2.level2_1 = "bulkUdate-2_1: " + value
        });
    };

    // Input change handler
    handleChange_updateAsync = async (event: any) => {
        async function sleep(ms: number) {
            const promise = new Promise<void>((res) => setTimeout(res, ms));
            await promise;
        }

        // Get input value from "event"
        const value = event.target.value;
        this.binded.level1 = "asyncBulkUpdate-1: Waiting";
        this.binded.level2.level2_1 = "asyncBulkUpdate-2_1: Waiting ";
        
        // Perform multiple updates within a single setState call
        await this.binded.update(async (b: any) => {
            await sleep(1000);
            b.level1 = "asyncBulkUpdate-1: " +  value;
            b.level2.level2_1 = "asyncBulkUpdate-2_1: " + value
        });
    };

    // Input change handler
    handleChange_set = (event: any) => {
        // Get input value from "event"
        const value = event.target.value;

        this.binded.set({
            level1: "setOperation-1: " + value,
            level2: {level2_1: "setOperation-2_1: " + value}
        })
    };
  render() {
        return (
            <div>
                <h1>Simple examples</h1>
                <div>
                    <h3>isBinded() Test</h3>
                    <p>Component this.binded is{isBinded(this.binded)?' ': ' NOT ' }Binded</p>
                    <p>Component this.binded.lelvel2 is{isBinded(this.binded.level2)?' ': ' NOT ' }Binded</p>
                    <p>Component this.state is{isBinded(this.state)?' ': ' NOT ' }Binded</p>
                    <p>Component this.state.level2 is{isBinded(this.state.level2)?' ': ' NOT ' }Binded</p>
                </div>
                <div>
                    <h3>Binding tests</h3>
                    <p>
                        Replaces primitive:
                        <input type="text" onChange={this.handleChange_replacePrimitive} />
                    </p>
                    <p>
                        Replaces an object within the state:
                        <input type="text" onChange={this.handleChange_objectReplacement} />
                    </p>
                    <p>
                        Bulk updates:
                        <input type="text" onChange={this.handleChange_update} />
                    </p>
                    <p>
                        Bulk updates async:
                        <input type="text" onChange={this.handleChange_updateAsync} />
                    </p>
                    <p>
                        Set operation:
                        <input type="text" onChange={this.handleChange_set} />
                    </p>
                </div>
                <div>
                    <p><b>state.text.level1:</b> {this.state.level1}</p>
                    <p><b>state.text.level2.level2_1:</b> {this.state.level2.level2_1}</p>
                </div>
            </div>
        );
    }
}
  

```
