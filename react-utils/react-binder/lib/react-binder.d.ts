import React from 'react';
declare type SetStateFunc<S extends {}> = (state: S, callback?: () => void) => void;
/**
 * Binding Options to confgure the binding between the state
 *
 * @property whenShouldSetState     Determines if the state should be updated only when are changes or allways no matter if the value is the same.
 * @property clonningOption         Determines the cloning method to use for the state either shallow or deep copy.
 */
export declare type BindingOptions = {
    whenShouldSetState?: 'allways' | 'onlyOnChanges';
    cloningOption?: "deep" | "shallow";
};
/**
 * Binded<T extends {}> object type.
 */
export declare type Binded<S extends {}> = S & {
    updateAsync(asynUpdateFunc: (prevState: S) => Promise<void>): Promise<void>;
    update(updateFunc: (prevState: S) => void): void;
    set(newState: S): void;
    toString(): string;
};
/**
 * Helper function that returns true if the object is considered to be Binded otherwise false.
 *
 * @param obj Object to check if it's binded
 * @returns {boolean} True if the object is Binded otherwise false
 */
export declare function isBinded<T extends object>(obj: Binded<T> | any): boolean;
export declare namespace StateBinder {
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
    function create<TState extends {}>(state: TState, setStateFunc: SetStateFunc<TState>, options?: BindingOptions): Binded<TState>;
}
export declare namespace ComponentStateBinder {
    /**
     * Creates a Binded state for the type {@link TState} of a Component State which allows
     * you to modify and update the state as the properties of the state has been updated.
     *
     * @param {React.Component} component   React Component to create the Binded State from.
     * @param {BindingOptions}  options     Additional options to configure the binder.
     *
     * @returns {@link Binded<TState>} for the {@link React.Component}.
     */
    function create<TProps, TState extends {}>(component: React.Component<TProps, TState>, options?: BindingOptions): Binded<TState>;
}
export {};
