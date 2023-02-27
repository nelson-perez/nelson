import 'typescript';
import React from 'react';
import { deepCopy, shallowCopy } from './utils';


export type BindedState<S extends object> = {
    asyncBulkUpdate(asynUpdateFunc: (prevState: S) => Promise<void>): Promise<void>,
    bulkUpdate(updateFunc: (prevState: S) => void): void,
    setState(newState: S): void,
    toString(): string
} & S

const EmptyBinderTemplate = {
    async asyncBulkUpdate(asynUpdateFunc: (prevState: any) => Promise<void>): Promise<void> {},
    bulkUpdate(updateFunc: (prevState: any) => void) {},
    setState(newState: any) {},
    toString() { return  '' }
}

export function EmptyBindedState(): BindedState<any> {
    return {...EmptyBinderTemplate};
}

// Options
type BindingOptions = {
    updateState: 'allways' | 'onlyOnChanges',
    cloningOption?: "deep" | "shallow"
};

type InternalBindingOptions = {
    seenValues?: WeakMap<object, BindedState<any>>,
    copy: (obj: any) => any,
} & BindingOptions;

// Default value of the options if not presented
const DEFAULT_BINDING_OPTIONS: BindingOptions = { updateState: 'onlyOnChanges', cloningOption: "shallow" };

export namespace StateBinder { 
    /**
     * 
     * @param state React state
     * @param setState Set state function to update once there is a change to the BindedState
     * @param options Additional options to configure the state binder.
     * @returns 
     */
    export function create<S extends object>(
        state: S,
        setState: (prevState: Readonly<S>, callback: () => any) => any,
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): BindedState<S> {
            const internalOptions = createInternalOptions(options);
            const context = createBindingContext(state, setState, internalOptions.copy);

            const binder: any = {
                async asyncBulkUpdate(asynUpdateFunc: (prevState: S) => Promise<void>): Promise<void> {
                    const nextState = internalOptions.copy(context.current);
                    await asynUpdateFunc(nextState);
                    const safeNextState = internalOptions.copy(nextState);
                    context.current = safeNextState;
                    context.onChange();
                },
                bulkUpdate(updateFunc: (prevState: S) => void) {
                    const nextState = internalOptions.copy(context.current);
                    updateFunc(nextState);
                    const safeNextState = internalOptions.copy(nextState);
                    context.current = safeNextState;
                    context.onChange();
                },
                setState(newState: S) {
                    binder.bulkUpdate((prevState: S) => {
                        Object.assign(prevState, newState);
                    });
                },
                toString(): string { return JSON.stringify(context.current) }
            };

            for(const [key, value] of Object.entries(state)) {
                const bindedProperty = bindProperty(key, value, context, internalOptions);
                Object.defineProperty(binder, key, bindedProperty);
            }

            return binder;
    }

    /**
     * Create an empty {@link BindedState<any>}
     * 
     * @returns Empty {@link BindedState<any>}
     */
    export function empty() {
        return EmptyBindedState();
    }
}

export namespace ComponentBinder {
    /**
     * Creates a BindedState of a Component State which allows you to modify and update the state
     * as the properties of the state has been updated.
     * 
     * @param component React Component to create the Binded State from
     * @param options Additional options to configure the binder
     * @returns {@link BindedState} for {@link React.Component}.
     */
    export function create<P, S extends {}>(
        component: React.Component<P, S>,
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): BindedState<S> {
            return StateBinder.create(
                component.state,
                (state, callback) => component.setState(state, callback),
                options);
    }

    /**
     * Create an empty {@link BindedState<any>}
     * 
     * @returns Empty {@link BindedState<any>}
     */
    export function empty() {
        return EmptyBindedState();
    }    
}

// Privates
/**
 * Helper function to create the binding context used to manage the state internally.
 * 
 * @param state The state object
 * @param setState The setState function to perform evertime there is a change.
 * @param copy The copy function to use to perform a copy operations
 * @returns Return a Binding Context necesary to create the {@link BindedState}
 */
function createBindingContext<S extends object>(
    state: S,
    setState: (prevState: Readonly<S>, callback: () => any) => any,
    copy: (obj: any) => any) {
        const context = {
            current: copy(state),
            setState: setState,
            onChange: () => { // TODO: Fix the copy issues
                const nextState: Readonly<S> = copy(context.current);
                setState(nextState, () => context.current = nextState)
            },
            isDirty: false,
        };
        return context;
}

/**
 * Helper function to bind a object property
 * 
 * @param key The property key string to update
 * @param value The value for that property
 * @param context The Binding Context with the information needed to perform the binding.
 * @param options Additional options to perform the binding.
 * @returns A binded property to assign to the object.
 */
function bindProperty<TProperty>(
    key: string,
    value: TProperty,
    context: any,
    options: InternalBindingOptions) {
        console.log({bindProperty: {key, context}});
        if(key === '') return value;
        return {
            get () {
                const value = context.current[key];
                if(typeof value === 'object' && !Array.isArray(value)) {
                    const seened = options.seenValues?.get(value);
                    if(seened !== undefined) return seened;
                    const binded = StateBinder.create(value, context.setState, options);
                    options.seenValues?.set(value, binded);
                    return binded;
                }
                return value;
            },
            set(newVal: any) {
                if(context.current[key] === newVal && options.updateState === 'onlyOnChanges') return;
                context.current[key] = newVal;
                context.onChange();
            }
        }
    }

/**
 * Helper function to convert the {@link BindingOptions} to {@link InternalBindingOptions}
 * 
 * @param {BindingOptions} options Binding options passed through the exported functions
 * @returns {InternalBindingOptions} Converted {@link InternalBindingOptions}
 */
function createInternalOptions(options: BindingOptions): InternalBindingOptions {
    let copy: (obj: any) => any;
    switch(options.cloningOption) {
        case "deep":
            copy = deepCopy
            break;
        case "shallow":
        default:
            copy = shallowCopy
    }
    return { copy: copy, seenValues: new WeakMap<object, object>(), ...options};
}
