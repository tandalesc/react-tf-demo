import React, { Fragment, PureComponent } from 'react';
import * as tf from '@tensorflow/tfjs';

import SymmetricPairMatching from './models/SymmetricPairMatching';
import AsymmetricPairMatching from './models/AsymmetricPairMatching';
import Type, { NoType } from './data/Type';
import Element from './data/Element';
import HookahFlavors from './data/HookahFlavors';

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
    model: "asymmetricPairMatching",
    dataset: "hookahFlavors",
    testPredict: "Limoncello",
    buildingLogic: "typePairingWithFeatures",
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
    this.models.symmetricPairMatching = new SymmetricPairMatching(tf, {
      numCategories: Element.next_id,
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
    this.models.asymmetricPairMatching = new AsymmetricPairMatching(tf, {
      numCategories: Element.next_id,
      numFeatures: Type.next_id,
      adaptNeuronCount: true,
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
      numLayers: 3
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
      workingDataset: "",
      status: "state.loadData",
      allowedToTrain: false,
      allowedToPredict: false
    });
    this.initializeModels();
  }

  saveModelOC = () => {
    const modelName = prompt("Which model would you like to save to localstorage?");
    this.models.pairMatching.saveModel(modelName);
  };

  loadModelOC = () => {
    const modelName = prompt("Which model would you like to import from localstorage?");
    this.initializeModels();
    this.models.pairMatching.loadModel(modelName);
    this.setState({
      trainingLog: [],
      allowedToPredict: true,
      status: "state.trained"
    });
  };

  trainModelOC = () => {
    if(this.state.allowedToTrain) {
      let xs,ys;
      if(HookahFlavors.buildingLogic[this.state.buildingLogic].extraFeatures) {
        xs = tf.slice(this.state.tensorData.transpose(), [0], [3]).transpose();
        ys = tf.slice(this.state.tensorData.transpose(), [3]).squeeze();
      } else {
        [xs,ys] = tf.split(this.state.tensorData.transpose(), 2, 0);
        xs = xs.squeeze();
        ys = ys.squeeze();
      }
      this.setState({
        disableButtons: true,
        status: "state.training"
      });
      this.models[this.state.model].trainModel(xs, ys, {
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
    let pairTableRows;
    let tensorData;
    if(HookahFlavors.buildingLogic[this.state.buildingLogic].extraFeatures) {
      pairTableRows = flavorPairs
        .map(([p1,t11,t12,p2])=>([Element.maps.id.get(p1).name, Element.maps.id.get(p2).name]))
        .sort((pair1,pair2)=>(pair1[0]+pair1[1]).localeCompare(pair2[0]+pair2[1]))
        .map(([p1,p2])=>(
          <tr>
            <td>{p1}</td>
            <td>{p2}</td>
          </tr>
        ));
      tensorData = tf.tensor(flavorPairs, [flavorPairs.length, 4], 'int32');
    } else {
      pairTableRows = flavorPairs
        .map(([p1,p2])=>([Element.maps.id.get(p1).name, Element.maps.id.get(p2).name]))
        .sort((pair1,pair2)=>(pair1[0]+pair1[1]).localeCompare(pair2[0]+pair2[1]))
        .map(([p1,p2])=>(
          <tr>
            <td>{p1}</td>
            <td>{p2}</td>
          </tr>
        ));
      tensorData = tf.tensor(flavorPairs, [flavorPairs.length, 2], 'int32');
    }

    this.setState({
      workingDataset: pairTableRows,
      tensorData: tensorData,
      allowedToTrain: true,
      status: "state.readyToTrain"
    });
  };

  predictResultOC = () => {
    if(this.state.allowedToPredict) {
      if(Element.maps.name.has(this.state.testPredict)) {
        const testFlavor = Element.maps.name.get(this.state.testPredict);
        let testIdx;
        let prediction;
        if(this.state.model==="symmetricPairMatching") {
          testIdx = testFlavor.id;
          prediction = this.models[this.state.model].predict(tf.tensor([testIdx],[1],'int32'));
        } else if(this.state.model==="asymmetricPairMatching") {
          let firstTwoFeatures;
          if(testFlavor.types.length>1) {
            firstTwoFeatures = [testFlavor.types[0].id, testFlavor.types[1].id];
          } else {
            firstTwoFeatures = [testFlavor.types[0].id, NoType.id];
          }
          testIdx = testFlavor.id;
          const testVec = [testFlavor.id].concat(firstTwoFeatures);
          prediction = this.models[this.state.model].predict(tf.tensor([testVec],[1,3],'int32').squeeze());
        }
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
              name: i===testIdx ? "<don't mix>" : Element.maps.id.get(i).name,
              probability:e
            }))
            .sort((l1,l2)=>l2.probability-l1.probability)
            .slice(0, this.state.topN)
            .map(({name, probability}, id)=>(
              <tr key={id}>
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

              <label htmlFor="modelInput">Model</label>
              <select value={this.state.model} onChange={this.updateFreeTextField('model')} id="modelInput">
                {Object.values(this.models).map((e)=>(
                  <option value={e.code}>{e.name}</option>
                ))}
              </select>

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
                <button disabled={this.state.disableButtons || !this.state.allowedToPredict} onClick={this.saveModelOC}>Save</button>
                <button disabled={this.state.disableButtons} onClick={this.loadModelOC}>Load</button>
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
