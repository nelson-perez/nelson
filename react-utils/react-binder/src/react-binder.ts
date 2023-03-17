import React from 'react';


// Simple helper copy functions
const shallowCopy = (x: any) => {return {...x}};
const deepCopy = (x: any) => structuredClone(x);


// Type of the setState() function in order for the binder to work.
export type SetStateFunction<S extends {}> = (
    state: S
) => void


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

/**
 * Binded<T extends {}> object type.
 */
export type Binded<S extends {}> = S & {
    updateAsync(asynUpdateFunc: (prevState: S) => Promise<void>): Promise<void>,
    update(updateFunc: (prevState: S) => void): void,
    set(newState: Partial<S>): void,
    toString(): string
};

/**
 * BindedState<T extends {}> object type.
 */
export type BindedState<S extends {}> = Binded<S>;

/**
 * Helper function that returns true if the object is considered to be Binded otherwise false.
 * 
 * @param obj Object to check if it's binded
 * @returns {boolean} True if the object is Binded otherwise false
 */
export function isBinded<T extends object>(obj: Binded<T> | any): boolean {
    return obj?.__binded;
}

export namespace StateBinder {
    /**
     * Creates a {@link Binded} state based on the passed state which call setState call for every change.
     * 
     * DO NOT use when declaring the a variable in the {@link React.Component} class as
     * the setSate gets replaced after declared. Use the {@link ComponentBinder.create()}
     * function instead as it handles this case.
     * 
     * @param {TState}          state           React state variable to use
     * @param {Function}        setStateFunc    Function pass the state once there is a change to the Binded
     * @param {BindingOptions}  options         Additional options to configure the state binder.
     * 
     * @returns {@link Binded<T>} for {@link React.Component}.
     */
    export function create<TState extends {}>(
        state: TState,
        setStateFunc: SetStateFunction<TState>,
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): BindedState<TState> {
            // Check if the object is already binded to another setState
            if(isBinded(state)) {
                console.warn('The object is already binded');
            }
            const stateContext = createStateBindingContext(state, setStateFunc, options);
            const stateProxy = createProxy(stateContext.current, stateContext);

            return stateProxy;
    };

    // Helper function that actually creates the Binded object
    function createProxy<TState extends {}, T extends {}>(current: any, parentContext: Context<TState>): Binded<any> {
        const context = createChildContext(current, parentContext);
        const handler = {
            get: (target: any, key: string): Binded<any> => {
                // if(!Object.hasOwn(target, key)) {
                //     return undefined;
                // }
                const value = target[key];
                if (typeof value !== "object") {
                    return value;
                }

                if(isBinded(value)) {
                    return value;
                }

                const proxy = createProxy(context.current[key], context);
                target[key] = proxy
                return proxy;
            },
            set: (target: any, prop: string, value: any) => {
                if(context.current[prop] === value && context.options.whenShouldSetState === 'onlyOnChanges') {
                    return true;
                }

                target[prop] = value;
                context.current[prop] = value;
                context.onChange();
                return true;
            }
        }

        const binder: Binded<T | any> = {
            ...context.current,
            __binded: true,
            update(func: (x: T) => void | PromiseLike<void>): void | Promise<void> {
                const prev = context.copy(context.current);
                const undefinedOrPromise = func(prev);

                // If it's an async function or returns a promise handles it.
                if(undefinedOrPromise instanceof Promise) {
                    const promise = undefinedOrPromise.then(() => {
                        binder.set(prev);
                    });
                    return promise;
                }
                binder.set(prev);
            },
            set(newValues: Partial<T>): T {
                const safeNext = context.copy(newValues);
                Object.assign(context.current, safeNext);
                Object.assign(binder, safeNext);
                context.onChange();
                return binder;
            },
            toString(): string {
                return JSON.stringify(context.current);
            }
        };
        const toProxy = binder
        const proxy = new Proxy(toProxy, handler);
        return proxy;
    }
}

export namespace ComponentStateBinder {
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
        options: BindingOptions = DEFAULT_BINDING_OPTIONS): BindedState<TState> {
            const state: TState = component.state ?? {};
            const setStateFunc: SetStateFunction<TState> = (state: TState) => {
                component.setState(state);
            };
            const stateProxy = StateBinder.create(state, setStateFunc, options);
            return stateProxy;
    }
}

// Context
type Context<TState extends {}> = {
    current: any,
    copy: (x: any) => any,
    onChange: () => void,
    options: BindingOptions
};

/**
 * Helper function to create the binding context used to manage the state internally.
 * 
 * DO NOT use when declaring the a variable in the {@link React.Component} class as
 * the setSate gets replaced after declared. Use the {@link ComponentBinder.create()}
 * function instead.
 * 
 * @param state The state object
 * @param setState The setState function to perform evertime there is a change.
 * @param copy The copy function to use to perform a copy operations
 * 
 * @returns Return a Binding Context necesary to create the {@link Binded}
 */
function createStateBindingContext<TState extends {}>(
    state: TState,
    setStateFunc: SetStateFunction<TState>,
    options: BindingOptions): Context<TState> {
        let copy: (obj: any) => any;
        switch(options.cloningOption) {
            case "deep":
                copy = deepCopy
                break;
            case "shallow":
            default:
                copy = shallowCopy
        }

        const context: Context<TState> = {
            current: copy(state),
            copy: copy,
            onChange: () => {
                const nextState: Readonly<TState> = copy(context.current);
                setStateFunc(nextState);
            },
            options: options
        };
        return context;
}

/**
 * Helper function to create the binding context used to manage the state internally.
 * 
 * DO NOT use when declaring the variable in the {@link React.Component} class as
 * the setSate gets replaced after declared. Use the {@link ComponentBinder.create()}
 * function instead.
 * 
 * @param current The current object been minitored
 * @param state The state object
 * @param setState The setState function to perform evertime there is a change.
 * @param copy The copy function to use to perform a copy operations
 * 
 * @returns Return a Binding Context necesary to create the {@link Binded}
 */
function createChildContext<T extends {}>(current: T, parentContext: Context<any>): Context<T> {
        const context: Context<T> = {
            current: current,
            copy: parentContext.copy,
            onChange: parentContext.onChange,
            options: parentContext.options
        };
        return context;
}
