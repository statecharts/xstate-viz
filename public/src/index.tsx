import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Preview} from '@statecharts/xstate-viz';
import * as serviceWorker from './serviceWorker';
import { lightMachine as machine } from './machines/lightMachine'
import './App.css';

ReactDOM.render(<Preview machine={machine}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
