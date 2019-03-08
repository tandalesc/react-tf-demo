import React, { Component } from 'react';

import PairMatchingModel from './models/PairMatching';
import HookahFlavors, { buildMapFromPairs } from './data/HookahFlavors';

import './App.css';

const tf = require('@tensorflow/tfjs');

const parseIntNoNaN = (str) => str === '' ? 0 : parseInt(str);

const log_buffer_size = 25;

let next_log_key = 1;

class App extends Component {
  state = {
    trainingLog: [],
    batchSize: 10,
    epochs: 25,
    predict: "Paan"
  };

  data = {
    hookahFlavors: new HookahFlavors(),
    hookahFlavorPairs: null
  };

  models = {
    pairMatching: new PairMatchingModel(tf, this.data.hookahFlavors.flavorList.length, this.recordTrainingEpoch)
  };

  recordTrainingEpoch = (epoch, log) => {
    this.setState({trainingLog: this.state.trainingLog.slice(-log_buffer_size,log_buffer_size+1).concat({epoch:epoch, log:log})});
  };

  trainModelOC = () => {
    const data = this.data.hookahFlavorPairs ? this.data.hookahFlavorPairs : null;
    this.models.pairMatching.trainModel(data, this.state.batchSize, this.state.epochs);
  };

  makeDataOC = () => {
    const flavorPairs = this.data.hookahFlavors.buildFlavorPairs(200);
    console.log("Translation Maps:",this.data.hookahFlavors.getFlavorTranslationMaps());
    const flavorMap = buildMapFromPairs(flavorPairs);
    console.log(flavorPairs, flavorMap);
    this.data.hookahFlavorPairs = tf.tensor(flavorPairs,[200,2],'int32');
    this.data.hookahFlavorPairs.concat(tf.clone(this.data.hookahFlavorPairs).reverse());
  };

  predictResultOC = () => {
    const {forward, backward} = this.data.hookahFlavors.getFlavorTranslationMaps();
    if(forward.has(this.state.predict)) {
      const predictionIndex = forward.get(this.state.predict);
      const prediction = this.models.pairMatching.predict(tf.tensor([predictionIndex],[1],'int32'));
      const closestMatch = tf.argMax(tf.unstack(prediction)[0]);
      const jsValue = Array.from(closestMatch.dataSync())[0];
      console.log("Prediction: "+tf.unstack(prediction)[0]);
      console.log("Prediction: "+backward.get(jsValue));
    } else {
      alert(`Could not find ${this.state.predict} in the flavor database.`);
    }
  };

  updateFreeTextField = (key, transform=(_e)=>_e) => (e) => {
    this.setState({[key]: transform(e.target.value)});
  }

  render() {
    return (
      <div className="App">
        <div className="training">
          <h4>Training Log</h4>
          <table className="training-log">
            <tbody>
              {this.state.trainingLog.map(({epoch, log}) => {
                return (
                  <tr key={next_log_key++}>
                    <td>{epoch}</td>
                    <td>{log.loss}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="controls">
          <div style={{display:"flex", flexDirection:"column", width:300, marginTop:10}}>
            <label htmlFor="batchSizeInput">Batch Size</label>
            <input type="text" onChange={this.updateFreeTextField('batchSize',parseIntNoNaN)} value={this.state.batchSize} id="batchSizeInput"/>

            <label htmlFor="epochsInput">Epochs</label>
            <input type="text" onChange={this.updateFreeTextField('epochs',parseIntNoNaN)} value={this.state.epochs} id="epochsInput"/>

            <label htmlFor="predictInput">Predict</label>
            <input type="text" onChange={this.updateFreeTextField('predict')} value={this.state.predict} id="predictInput"/>
          </div>
          <div style={{display:"flex", marginTop:10}}>
            <button onClick={this.makeDataOC}>Generate Data</button>
            <button onClick={this.trainModelOC}>Train</button>
            <button onClick={this.predictResultOC}>Predict</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
