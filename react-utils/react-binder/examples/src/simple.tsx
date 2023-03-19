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
  