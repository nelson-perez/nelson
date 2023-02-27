import 'typescript';
import React from 'react';
export declare type BindedState<S extends object> = {
    asyncBulkUpdate(asynUpdateFunc: (prevState: S) => Promise<void>): Promise<void>;
    bulkUpdate(updateFunc: (prevState: S) => void): void;
    setState(newState: S): void;
    toString(): string;
} & S;
export declare function EmptyBindedState(): BindedState<any>;
declare type BindingOptions = {
    updateState: 'allways' | 'onlyOnChanges';
    cloningOption?: "deep" | "shallow";
};
export declare namespace StateBinder {
    /**
     *
     * @param state React state
     * @param setState Set state function to update once there is a change to the BindedState
     * @param options Additional options to configure the state binder.
     * @returns
     */
    function create<S extends object>(state: S, setState: (prevState: Readonly<S>, callback: () => any) => any, options?: BindingOptions): BindedState<S>;
    /**
     * Create an empty {@link BindedState<any>}
     *
     * @returns Empty {@link BindedState<any>}
     */
    function empty(): any;
}
export declare namespace ComponentBinder {
    /**
     * Creates a BindedState of a Component State which allows you to modify and update the state
     * as the properties of the state has been updated.
     *
     * @param component React Component to create the Binded State from
     * @param options Additional options to configure the binder
     * @returns {@link BindedState} for {@link React.Component}.
     */
    function create<P, S extends {}>(component: React.Component<P, S>, options?: BindingOptions): BindedState<S>;
    /**
     * Create an empty {@link BindedState<any>}
     *
     * @returns Empty {@link BindedState<any>}
     */
    function empty(): any;
}
export {};
