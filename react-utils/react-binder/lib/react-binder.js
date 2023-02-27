"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentBinder = exports.StateBinder = exports.EmptyBindedState = void 0;
require("typescript");
const utils_1 = require("./utils");
const EmptyBinderTemplate = {
    asyncBulkUpdate(asynUpdateFunc) {
        return __awaiter(this, void 0, void 0, function* () { });
    },
    bulkUpdate(updateFunc) { },
    setState(newState) { },
    toString() { return ''; }
};
function EmptyBindedState() {
    return Object.assign({}, EmptyBinderTemplate);
}
exports.EmptyBindedState = EmptyBindedState;
// Default value of the options if not presented
const DEFAULT_BINDING_OPTIONS = { updateState: 'onlyOnChanges', cloningOption: "shallow" };
var StateBinder;
(function (StateBinder) {
    /**
     *
     * @param state React state
     * @param setState Set state function to update once there is a change to the BindedState
     * @param options Additional options to configure the state binder.
     * @returns
     */
    function create(state, setState, options = DEFAULT_BINDING_OPTIONS) {
        const internalOptions = createInternalOptions(options);
        const context = createBindingContext(state, setState, internalOptions.copy);
        const binder = {
            asyncBulkUpdate(asynUpdateFunc) {
                return __awaiter(this, void 0, void 0, function* () {
                    const nextState = internalOptions.copy(context.current);
                    yield asynUpdateFunc(nextState);
                    const safeNextState = internalOptions.copy(nextState);
                    context.current = safeNextState;
                    context.onChange();
                });
            },
            bulkUpdate(updateFunc) {
                const nextState = internalOptions.copy(context.current);
                updateFunc(nextState);
                const safeNextState = internalOptions.copy(nextState);
                context.current = safeNextState;
                context.onChange();
            },
            setState(newState) {
                binder.bulkUpdate((prevState) => {
                    Object.assign(prevState, newState);
                });
            },
            toString() { return JSON.stringify(context.current); }
        };
        for (const [key, value] of Object.entries(state)) {
            const bindedProperty = bindProperty(key, value, context, internalOptions);
            Object.defineProperty(binder, key, bindedProperty);
        }
        return binder;
    }
    StateBinder.create = create;
    /**
     * Create an empty {@link BindedState<any>}
     *
     * @returns Empty {@link BindedState<any>}
     */
    function empty() {
        return EmptyBindedState();
    }
    StateBinder.empty = empty;
})(StateBinder = exports.StateBinder || (exports.StateBinder = {}));
var ComponentBinder;
(function (ComponentBinder) {
    /**
     * Creates a BindedState of a Component State which allows you to modify and update the state
     * as the properties of the state has been updated.
     *
     * @param component React Component to create the Binded State from
     * @param options Additional options to configure the binder
     * @returns {@link BindedState} for {@link React.Component}.
     */
    function create(component, options = DEFAULT_BINDING_OPTIONS) {
        return StateBinder.create(component.state, (state, callback) => component.setState(state, callback), options);
    }
    ComponentBinder.create = create;
    /**
     * Create an empty {@link BindedState<any>}
     *
     * @returns Empty {@link BindedState<any>}
     */
    function empty() {
        return EmptyBindedState();
    }
    ComponentBinder.empty = empty;
})(ComponentBinder = exports.ComponentBinder || (exports.ComponentBinder = {}));
// Privates
/**
 * Helper function to create the binding context used to manage the state internally.
 *
 * @param state The state object
 * @param setState The setState function to perform evertime there is a change.
 * @param copy The copy function to use to perform a copy operations
 * @returns Return a Binding Context necesary to create the {@link BindedState}
 */
function createBindingContext(state, setState, copy) {
    const context = {
        current: copy(state),
        setState: setState,
        onChange: () => {
            const nextState = copy(context.current);
            setState(nextState, () => context.current = nextState);
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
function bindProperty(key, value, context, options) {
    console.log({ bindProperty: { key, context } });
    if (key === '')
        return value;
    return {
        get() {
            var _a, _b;
            const value = context.current[key];
            if (typeof value === 'object' && !Array.isArray(value)) {
                const seened = (_a = options.seenValues) === null || _a === void 0 ? void 0 : _a.get(value);
                if (seened !== undefined)
                    return seened;
                const binded = StateBinder.create(value, context.setState, options);
                (_b = options.seenValues) === null || _b === void 0 ? void 0 : _b.set(value, binded);
                return binded;
            }
            return value;
        },
        set(newVal) {
            if (context.current[key] === newVal && options.updateState === 'onlyOnChanges')
                return;
            context.current[key] = newVal;
            context.onChange();
        }
    };
}
/**
 * Helper function to convert the {@link BindingOptions} to {@link InternalBindingOptions}
 *
 * @param {BindingOptions} options Binding options passed through the exported functions
 * @returns {InternalBindingOptions} Converted {@link InternalBindingOptions}
 */
function createInternalOptions(options) {
    let copy;
    switch (options.cloningOption) {
        case "deep":
            copy = utils_1.deepCopy;
            break;
        case "shallow":
        default:
            copy = utils_1.shallowCopy;
    }
    return Object.assign({ copy: copy, seenValues: new WeakMap() }, options);
}
