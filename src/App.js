import React, { Fragment, Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import PairMatchingModel from './models/PairMatching';
import HookahFlavors, { Flavor } from './data/HookahFlavors';

import './App.css';

const parseIntNoNaN = (str) => str === '' ? 0 : parseInt(str);
const parseFloatNoNaN = (str) => str === '' ? 0.0 : parseFloat(str);

let logRecorderKey = 0;

class App extends Component {
  state = {
    trainingLog: [],
    dataSize: 1600,
    batchSize: 30,
    epochs: 50,
    dropout: 0.15,
    validationSplit: 0.28,
    topN: 8,
    log: [],
    testPredict: "Limoncello",
    testOutput: "",
    jsonData: "",
    disableButtons: false
  };
  data = {};
  models = {};

  componentDidMount() {
    this.initializeDataSources();
    this.initializeModels();
  }

  initializeModels = () => {
    this.models.pairMatching = new PairMatchingModel(tf, {
      numCategories: Flavor.count,
      dropout: this.state.dropout,
      validationSplit: this.state.validationSplit,
      logRecorder: (epoch, logs) => {
        this.setState({
          log: this.state.log.concat([(
            <tr key={logRecorderKey++}>
              <td>{epoch}</td>
              <td>{(logs.val_loss).toFixed(5)}</td>
              <td>{(logs.loss).toFixed(5)}</td>
            </tr>
          )])
        });
      },
      numLayers: 2
    });
  }

  initializeDataSources = () => {
    this.data.hookahFlavors = new HookahFlavors();
  }

  resetModelOC = () => {
    this.setState({
      trainingLog: [],
      log: [],
      testOutput: "",
      jsonData: ""
    });
    this.initializeModels();
  }

  trainModelOC = () => {
    const data = this.state.hookahFlavorPairs;
    this.setState({disableButtons: true});
    this.models.pairMatching.trainModel(data, {
      batchSize: this.state.batchSize,
      epochs: this.state.epochs,
      validationSplit: this.state.validationSplit
    })
      .then(()=>{
        this.setState({disableButtons: false});
      })
  };

  makeDataOC = () => {
    const flavorPairs = this.data.hookahFlavors.buildFlavorPairs(this.state.dataSize, HookahFlavors.typePairingBuildingLogic);
    const translatedPairs = flavorPairs
      .map(([p1,p2])=>([Flavor.maps.index.get(p1).name, Flavor.maps.index.get(p2).name]))
      .sort((pair1,pair2)=>(pair1[0]+pair1[1]).localeCompare(pair2[0]+pair2[1]))
      .map(([p1,p2])=>(
        <tr>
          <td>{p1}</td>
          <td>{p2}</td>
        </tr>
      ));

    this.setState({jsonData: translatedPairs,
      hookahFlavorPairs: tf.tensor(flavorPairs, [flavorPairs.length, 2],'int32')
    });
  };

  predictResultOC = () => {
    if(Flavor.maps.name.has(this.state.testPredict)) {
      const testFlavor = Flavor.maps.name.get(this.state.testPredict);
      const testIdx = testFlavor.index;
      const prediction = this.models.pairMatching.predict(tf.tensor([testIdx],[1],'int32'));
      const prediction_js = Array.from(tf.unstack(prediction)[0].dataSync());
      /* Calculate top n indices
      const n = 3;
      const top_n = Array.from(tf.unstack(prediction)[0].dataSync()).sort().slice(-n).reverse();
      const match_indices = top_n.map(match=>prediction_js.findIndex(e=>e===match));
      const match_names = match_indices.map(idx=>Flavor.maps.index.get(idx).name);
      */

      this.setState({
        trainingLog: prediction_js
          .map((e,i)=>({
            name: i===testIdx ? "<don't mix>" : Flavor.maps.index.get(i).name,
            probability:e
          }))
          .sort((l1,l2)=>l2.probability-l1.probability)
          .slice(0, this.state.topN)
          .map(({name, probability}, index)=>(
            <tr key={index}>
              <td>
                {name}
              </td>
              <td>
                {(probability*100).toFixed(4)}
              </td>
            </tr>
          ))
      });
    } else {
      alert(`Could not find ${this.state.testPredict} in the flavor database.`);
    }
  };

  updateFreeTextField = (key, transform=(_e)=>_e) => (e) => {
    this.setState({[key]: transform(e.target.value)});
  }

  render() {
    return (
      <div className="App">
        <div className="probabilityTable">
          <table>
            <thead>
              <tr>
                <td>Name</td>
                <td>Probability (%)</td>
              </tr>
            </thead>
            <tbody>
              {this.state.trainingLog}
            </tbody>
          </table>
        </div>
        <div className="controls">
          <div style={{display:"flex", flexDirection:"column"}}>
            <label htmlFor="dataSizeInput">Data Size</label>
            <input type="text" onChange={this.updateFreeTextField('dataSize',parseIntNoNaN)} value={this.state.dataSize} id="dataSizeInput"/>

            <label htmlFor="batchSizeInput">Batch Size</label>
            <input type="text" onChange={this.updateFreeTextField('batchSize',parseIntNoNaN)} value={this.state.batchSize} id="batchSizeInput"/>

            <label htmlFor="epochsInput">Epochs</label>
            <input type="text" onChange={this.updateFreeTextField('epochs',parseIntNoNaN)} value={this.state.epochs} id="epochsInput"/>

            <label htmlFor="dropoutInput">Dropout</label>
            <input type="text" onChange={this.updateFreeTextField('dropout',parseFloatNoNaN)} value={this.state.dropout} id="dropoutInput"/>

            <label htmlFor="validationSplitInput">Validation Split</label>
            <input type="text" onChange={this.updateFreeTextField('validationSplit',parseFloatNoNaN)} value={this.state.validationSplit} id="validationSplitInput"/>

            <label htmlFor="predictInput">Predict</label>
            <input type="text" onChange={this.updateFreeTextField('testPredict')} value={this.state.testPredict} id="predictInput"/>

            <label htmlFor="topNInput"># Of Results to Show</label>
            <input type="text" onChange={this.updateFreeTextField('topN',parseIntNoNaN)} value={this.state.topN} id="topNInput"/>
          </div>
          <div style={{display:"flex"}}>
            <button disabled={this.state.disableButtons} onClick={this.makeDataOC}>Generate Data</button>
            <button disabled={this.state.disableButtons} onClick={this.trainModelOC}>Train</button>
            <button disabled={this.state.disableButtons} onClick={this.predictResultOC}>Predict</button>
            <button disabled={this.state.disableButtons} onClick={this.resetModelOC}>Reset</button>
          </div>
        </div>
        <div className="dataset">
          <table>
            <thead>
              <tr>
                <td>Flavor 1</td>
                <td>Flavor 2</td>
              </tr>
            </thead>
            <tbody>
              {this.state.jsonData}
            </tbody>
          </table>
        </div>
        <div className="log">
          <table>
            <thead>
              <tr>
                <td>Epoch</td>
                <td>Val Loss</td>
                <td>Loss</td>
              </tr>
            </thead>
            <tbody>
              {this.state.log}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
