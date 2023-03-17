"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentStateBinder = exports.StateBinder = exports.isBinded = void 0;
// Simple helper copy functions
const shallowCopy = (x) => { return Object.assign({}, x); };
const deepCopy = (x) => structuredClone(x);
// Default value of the options if not presented
const DEFAULT_BINDING_OPTIONS = { whenShouldSetState: 'onlyOnChanges', cloningOption: "shallow" };
/**
 * Helper function that returns true if the object is considered to be Binded otherwise false.
 *
 * @param obj Object to check if it's binded
 * @returns {boolean} True if the object is Binded otherwise false
 */
function isBinded(obj) {
    return obj === null || obj === void 0 ? void 0 : obj.__binded;
}
exports.isBinded = isBinded;
var StateBinder;
(function (StateBinder) {
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
    function create(state, setStateFunc, options = DEFAULT_BINDING_OPTIONS) {
        // Check if the object is already binded to another setState
        if (isBinded(state)) {
            console.warn('The object is already binded');
        }
        const stateContext = createStateBindingContext(state, setStateFunc, options);
        const stateProxy = createProxy(stateContext.current, stateContext);
        return stateProxy;
    }
    StateBinder.create = create;
    ;
    // Helper function that actually creates the Binded object
    function createProxy(current, parentContext) {
        const context = createChildContext(current, parentContext);
        const handler = {
            get: (target, key) => {
                // if(!Object.hasOwn(target, key)) {
                //     return undefined;
                // }
                const value = target[key];
                if (typeof value !== "object") {
                    return value;
                }
                if (isBinded(value)) {
                    return value;
                }
                const proxy = createProxy(context.current[key], context);
                target[key] = proxy;
                return proxy;
            },
            set: (target, prop, value) => {
                if (context.current[prop] === value && context.options.whenShouldSetState === 'onlyOnChanges') {
                    return true;
                }
                target[prop] = value;
                context.current[prop] = value;
                context.onChange();
                return true;
            }
        };
        const binder = Object.assign(Object.assign({}, context.current), { __binded: true, update(func) {
                const prev = context.copy(context.current);
                const undefinedOrPromise = func(prev);
                // If it's an async function or returns a promise handles it.
                if (undefinedOrPromise instanceof Promise) {
                    const promise = undefinedOrPromise.then(() => {
                        binder.set(prev);
                    });
                    return promise;
                }
                binder.set(prev);
            },
            set(newValues) {
                const safeNext = context.copy(newValues);
                Object.assign(context.current, safeNext);
                Object.assign(binder, safeNext);
                context.onChange();
                return binder;
            },
            toString() {
                return JSON.stringify(context.current);
            } });
        const toProxy = binder;
        const proxy = new Proxy(toProxy, handler);
        return proxy;
    }
})(StateBinder = exports.StateBinder || (exports.StateBinder = {}));
var ComponentStateBinder;
(function (ComponentStateBinder) {
    /**
     * Creates a Binded state for the type {@link TState} of a Component State which allows
     * you to modify and update the state as the properties of the state has been updated.
     *
     * @param {React.Component} component   React Component to create the Binded State from.
     * @param {BindingOptions}  options     Additional options to configure the binder.
     *
     * @returns {@link Binded<TState>} for the {@link React.Component}.
     */
    function create(component, options = DEFAULT_BINDING_OPTIONS) {
        var _a;
        const state = (_a = component.state) !== null && _a !== void 0 ? _a : {};
        const setStateFunc = (state) => {
            component.setState(state);
        };
        const stateProxy = StateBinder.create(state, setStateFunc, options);
        return stateProxy;
    }
    ComponentStateBinder.create = create;
})(ComponentStateBinder = exports.ComponentStateBinder || (exports.ComponentStateBinder = {}));
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
function createStateBindingContext(state, setStateFunc, options) {
    let copy;
    switch (options.cloningOption) {
        case "deep":
            copy = deepCopy;
            break;
        case "shallow":
        default:
            copy = shallowCopy;
    }
    const context = {
        current: copy(state),
        copy: copy,
        onChange: () => {
            const nextState = copy(context.current);
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
function createChildContext(current, parentContext) {
    const context = {
        current: current,
        copy: parentContext.copy,
        onChange: parentContext.onChange,
        options: parentContext.options
    };
    return context;
}
