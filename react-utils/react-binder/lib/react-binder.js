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
    if (obj && (obj === null || obj === void 0 ? void 0 : obj.__current)) {
        return true;
    }
    return false;
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
     * @param {Function}        setStateFunc    Function pass the state once there is a change to the BindedState
     * @param {BindingOptions}  options         Additional options to configure the state binder.
     *
     * @returns {@link Binded<T>} for {@link React.Component}.
     */
    function create(state, setStateFunc, options = DEFAULT_BINDING_OPTIONS) {
        const contextState = shallowCopy(state);
        const context = createBindingContext(contextState, contextState, setStateFunc, options);
        const stateProxy = createProxy(context.state, context);
        return stateProxy;
    }
    StateBinder.create = create;
    ;
    // Helper function that actually creates the Binded object
    function createProxy(current, parentContext) {
        const context = createChildContext(current, parentContext);
        const handler = {
            get: (target, key) => {
                if (typeof target[key] !== "object" || target[key] === null) {
                    return target[key];
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
        const binder = Object.assign(Object.assign({}, context.current), { __current: current, updateAsync(asyncFunc) {
                const prev = context.copy(context.current);
                return asyncFunc(prev).then(() => {
                    const safeNext = context.copy(prev);
                    binder.set(safeNext);
                    context.onChange();
                });
            },
            update(func) {
                const prev = context.copy(context.current);
                func(prev);
                const safeNext = context.copy(prev);
                binder.set(safeNext);
            },
            set(newValues) {
                const safeNext = context.copy(newValues);
                const assigned = Object.assign(context.current, safeNext);
                context.current = assigned;
                context.onChange();
                return assigned;
            },
            replace(newValue) {
                const safeNext = context.copy(newValue);
                context.current = safeNext;
                return binder;
            },
            toString() {
                return JSON.stringify(current);
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
 * @returns Return a Binding Context necesary to create the {@link BindedState}
 */
function createBindingContext(obj, state, setStateFunc, options) {
    let copy;
    const current = obj;
    switch (options.cloningOption) {
        case "deep":
            copy = deepCopy;
            break;
        case "shallow":
        default:
            copy = shallowCopy;
    }
    if (isBinded(current)) {
        console.log({ alreadyBinded: current });
    }
    const context = {
        state: state,
        current: current,
        copy: copy,
        onChange: () => {
            const nextState = copy(context.state);
            setStateFunc(nextState, () => context.state = nextState);
        },
        options: options
    };
    return context;
}
/**
 * Helper function to create the binding context used to manage the state internally.
 *
 * DO NOT use when declaring the a variable in the {@link React.Component} class as
 * the setSate gets replaced after declared. Use the {@link ComponentBinder.create()}
 * function instead.
 *
 * @param current The current object been minitored
 * @param state The state object
 * @param setState The setState function to perform evertime there is a change.
 * @param copy The copy function to use to perform a copy operations
 *
 * @returns Return a Binding Context necesary to create the {@link BindedState}
 */
function createChildContext(current, parentContext) {
    const context = {
        state: parentContext.state,
        current: current,
        copy: parentContext.copy,
        onChange: parentContext.onChange,
        options: parentContext.options
    };
    return context;
}
