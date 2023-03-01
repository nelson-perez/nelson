# React-Binder Examples App
## Overview
Under this folder there is a simple set of examples of using the nelson-react-binder utility to create a binded state that updates setState when there is a change.


## Running the sample App
Usually this would require to clone the repository and then perform the link an install.

### Setup
1. Clone the repository locally:
    ```bash
    git clone https://github.com/nelson-perez/nelson.git
    ```
2. Traverse to the __./nelson/react-utils/react-binder__ directory and install the dependencies for `react-binder`.
    ```bash
    cd nelson/react-utils/react-binder/
    npm install
    ```
3. Traverse to the __./examples__ directory and install it's dependencies.
    ```bash
    cd ./examples
    npm install
    ```
All commands togethers:

### Running the Examples App
Under the examples folder just run
```bash
npm start
```
Once the App is loaded and running a browser window should appear going to the application address.
If it doesn't you can go directly to the App in http://localhost:3000/

### Troubleshooting
> | _NOTE:_ | If you encounter issues with references to the `nelson-react-binder` module you could run the following commands|
> | - | -|
```bash
npm link ../
npm install ../ --save
```
