import React, { Fragment, PureComponent } from 'react';
import * as tf from '@tensorflow/tfjs';

import PairMatchingModel from './models/PairMatching';
import HookahFlavors, { Flavor } from './data/HookahFlavors';

import './App.css';

const parseIntNoNaN = (str) => str === '' ? 0 : parseInt(str);
const parseFloatNoNaN = (str) => str === '' ? 0.0 : parseFloat(str);

const states = [
  {
    order: 1,
    name: "Load Data",
    code: "state.loadData"
  },
  {
    order: 2,
    name: "Ready to Train",
    code: "state.readyToTrain"
  },
  {
    order: 3,
    name: "Training",
    code: "state.training"
  },
  {
    order: 4,
    name: "Trained",
    code: "state.trained"
  }
]

let logRecorderKey = 0;

class App extends PureComponent {
  state = {
    categoricalProbabilities: [],
    trainingLog: [],
    dataSize: 1600,
    batchSize: 30,
    epochs: 50,
    dropout: 0.15,
    validationSplit: 0.28,
    topN: 9,
    dataset: "hookahFlavors",
    testPredict: "Limoncello",
    buildingLogic: "typePairing",
    workingDataset: "",
    status: "",
    disableButtons: false,
    allowedToTrain: false,
    allowedToPredict: false
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
          trainingLog: this.state.trainingLog.concat([(
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
    this.setState({status: "state.loadData"});
  }

  initializeDataSources = () => {
    this.data.hookahFlavors = new HookahFlavors();
  }

  resetModelOC = () => {
    this.setState({
      categoricalProbabilities: [],
      trainingLog: [],
      testOutput: "",
      workingDataset: ""
    });
    this.initializeModels();
  }

  trainModelOC = () => {
    if(this.state.allowedToTrain) {
      const data = this.state.tensorData;
      this.setState({
        disableButtons: true,
        status: "state.training"
      });
      this.models.pairMatching.trainModel(data, {
        batchSize: this.state.batchSize,
        epochs: this.state.epochs,
        validationSplit: this.state.validationSplit
      })
        .then(()=>{
          this.setState({
            disableButtons: false,
            allowedToPredict: true,
            status: "state.trained"
          });
        })
    } else {
      console.log("Action not allowed.");
    }
  };

  makeDataOC = () => {
    const flavorPairs = this.data.hookahFlavors.buildFlavorPairs(this.state.dataSize, HookahFlavors.buildingLogic[this.state.buildingLogic]);
    const pairTableRows = flavorPairs
      .map(([p1,p2])=>([Flavor.maps.index.get(p1).name, Flavor.maps.index.get(p2).name]))
      .sort((pair1,pair2)=>(pair1[0]+pair1[1]).localeCompare(pair2[0]+pair2[1]))
      .map(([p1,p2])=>(
        <tr>
          <td>{p1}</td>
          <td>{p2}</td>
        </tr>
      ));

    this.setState({
      workingDataset: pairTableRows,
      tensorData: tf.tensor(flavorPairs, [flavorPairs.length, 2],'int32'),
      allowedToTrain: true,
      status: "state.readyToTrain"
    });
  };

  predictResultOC = () => {
    if(this.state.allowedToPredict) {
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
          categoricalProbabilities: prediction_js
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
        alert(`Could not find ${this.state.testPredict} in the database.`);
      }
    } else {
      console.log("Action not allowed.");
    }
  };

  updateFreeTextField = (key, transform=(_e)=>_e) => (e) => {
    this.setState({[key]: transform(e.target.value)});
  }

  render() {
    const currentStatus = states.find((e)=>e.code===this.state.status);
    return (
      <div className="AppContainer">
        <div className="AppHeader">
          <h3 style={{margin:0}}>ML Sandbox</h3>
          <label>Status: {currentStatus && currentStatus.name}</label>
        </div>
        <div className="App">
          <div className="probabilityTable">
            <table>
              <thead>
                <tr><td colspan="2">Test Results</td></tr>
                <tr>
                  <td>Name</td>
                  <td>Probability (%)</td>
                </tr>
              </thead>
              <tbody>
                {this.state.categoricalProbabilities}
              </tbody>
            </table>
          </div>
          <div className="controls">
            <div style={{display:"flex", flexDirection:"column"}}>
              <label htmlFor="datasetInput">Dataset</label>
              <select disabled={true} value={this.state.dataset} onChange={this.updateFreeTextField('dataset')} id="dataset">
                {[
                  {name:"Hookah Flavors", code:"hookahFlavors"}
                ].map((e)=>(
                  <option value={e.code}>{e.name}</option>
                ))}
              </select>

              <label htmlFor="dataSizeInput">Data Size</label>
              <input type="text" onChange={this.updateFreeTextField('dataSize',parseIntNoNaN)} value={this.state.dataSize} id="dataSizeInput"/>

              <label htmlFor="buildingLogicInput">Building Logic</label>
              <select value={this.state.buildingLogic} onChange={this.updateFreeTextField('buildingLogic')} id="buildingLogic">
                {Object.values(HookahFlavors.buildingLogic).map((e)=>(
                  <option value={e.code}>{e.name}</option>
                ))}
              </select>

              <div className="buttonPanel">
                <button disabled={this.state.disableButtons} onClick={this.makeDataOC}>Generate Data</button>
                <button disabled={this.state.disableButtons || true} onClick={()=>{}}>Save</button>
                <button disabled={this.state.disableButtons || true} onClick={()=>{}}>Load</button>
              </div>
              <br/>

              <label htmlFor="batchSizeInput">Batch Size</label>
              <input type="text" onChange={this.updateFreeTextField('batchSize',parseIntNoNaN)} value={this.state.batchSize} id="batchSizeInput"/>

              <label htmlFor="epochsInput">Epochs</label>
              <input type="text" onChange={this.updateFreeTextField('epochs',parseIntNoNaN)} value={this.state.epochs} id="epochsInput"/>

              <label htmlFor="dropoutInput">Dropout</label>
              <input type="text" onChange={this.updateFreeTextField('dropout',parseFloatNoNaN)} value={this.state.dropout} id="dropoutInput"/>

              <label htmlFor="validationSplitInput">Validation Split</label>
              <input type="text" onChange={this.updateFreeTextField('validationSplit',parseFloatNoNaN)} value={this.state.validationSplit} id="validationSplitInput"/>
              <div className="buttonPanel">
                <button disabled={this.state.disableButtons || !this.state.allowedToTrain} onClick={this.trainModelOC}>Train</button>
                <button disabled={this.state.disableButtons || true} onClick={()=>{}}>Save</button>
                <button disabled={this.state.disableButtons || true} onClick={()=>{}}>Load</button>
              </div>
              <br/>

              <label htmlFor="predictInput">Predict</label>
              <select value={this.state.testPredict} onChange={this.updateFreeTextField('testPredict')} id="predictInput">
                {HookahFlavors.flavorList.map((e)=>(
                  <option value={e.name}>{e.name}</option>
                ))}
              </select>

              <label htmlFor="topNInput"># Of Results to Show</label>
              <input type="text" onChange={this.updateFreeTextField('topN',parseIntNoNaN)} value={this.state.topN} id="topNInput"/>
              <div className="buttonPanel">
                <button disabled={this.state.disableButtons || !this.state.allowedToPredict} onClick={this.predictResultOC}>Predict</button>
                <button disabled={this.state.disableButtons} onClick={this.resetModelOC}>Reset</button>
              </div>
            </div>

          </div>
          <div className="dataset">
            <table>
              <thead>
                <tr><td colspan="2">Current Dataset</td></tr>
                <tr>
                  <td>Flavor 1</td>
                  <td>Flavor 2</td>
                </tr>
              </thead>
              <tbody>
                {this.state.workingDataset}
              </tbody>
            </table>
          </div>
          <div className="log">
            <table>
              <thead>
                <tr><td colspan="3">Training Progress</td></tr>
                <tr>
                  <td>Epoch</td>
                  <td>Val Loss</td>
                  <td>Loss</td>
                </tr>
              </thead>
              <tbody>
                {this.state.trainingLog}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
