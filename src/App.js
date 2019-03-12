import React, { Fragment, Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import PairMatchingModel from './models/PairMatching';
import HookahFlavors, { Flavor } from './data/HookahFlavors';

import './App.css';

const parseIntNoNaN = (str) => str === '' ? 0 : parseInt(str);

class App extends Component {
  state = {
    trainingLog: [],
    dataSize: 1200,
    batchSize: 30,
    epochs: 30,
    testPredict: "Paan",
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
    this.models.pairMatching = new PairMatchingModel(tf, this.data.hookahFlavors.flavorList.length);
  }

  initializeDataSources = () => {
    this.data.hookahFlavors = new HookahFlavors();
  }

  resetModelOC = () => {
    this.setState({
      trainingLog: [],
      testOutput: "",
      jsonData: ""
    });
    this.initializeModels();
  }

  trainModelOC = () => {
    const data = this.state.hookahFlavorPairs ? this.state.hookahFlavorPairs : null;
    this.setState({disableButtons: true});
    this.models.pairMatching.trainModel(data, this.state.batchSize, this.state.epochs)
      .then(()=>{
        this.setState({disableButtons: false});
      })
  };

  makeDataOC = () => {
    const flavorPairs = this.data.hookahFlavors.buildFlavorPairs(this.state.dataSize, this.data.hookahFlavors.typePairingBuildingLogic);
    const translatedPairs = flavorPairs.map(([p1,p2])=>(`${Flavor.maps.index.get(p1).name} - ${Flavor.maps.index.get(p2).name}`)).sort();

    this.setState({jsonData: (
        <Fragment>
          {translatedPairs.map((e)=>(<Fragment>{e}<br/></Fragment>))}
        </Fragment>
      ),
      hookahFlavorPairs: tf.tensor(flavorPairs, [flavorPairs.length, 2],'int32')
    });
  };

  predictResultOC = () => {
    if(Flavor.maps.name.has(this.state.testPredict)) {
      const testFlavor = Flavor.maps.name.get(this.state.testPredict);
      const testIdx = testFlavor.index;
      const prediction = this.models.pairMatching.predict(tf.tensor([testIdx],[1],'int32'));
      const prediction_js = Array.from(tf.unstack(prediction)[0].dataSync());
      const n = 3;
      const top_n = Array.from(tf.unstack(prediction)[0].dataSync()).sort().slice(-n).reverse();
      const match_indices = top_n.map(match=>prediction_js.findIndex(e=>e===match));
      const match_names = match_indices.map(idx=>Flavor.maps.index.get(idx).name);

      this.setState({
        testOutput: match_names.join(", "),
        trainingLog: prediction_js
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
        <table>
          <tbody>
            {this.state.trainingLog.map((e,i)=>(
              <tr key={i}>
                <td>{Flavor.maps.index.get(i).name}</td>
                <td>{e}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="controls">
          <div style={{display:"flex", flexDirection:"column", width:300, marginTop:10}}>
            <label htmlFor="dataSizeInput">Data Size</label>
            <input type="text" onChange={this.updateFreeTextField('dataSize',parseIntNoNaN)} value={this.state.dataSize} id="dataSizeInput"/>

            <label htmlFor="batchSizeInput">Batch Size</label>
            <input type="text" onChange={this.updateFreeTextField('batchSize',parseIntNoNaN)} value={this.state.batchSize} id="batchSizeInput"/>

            <label htmlFor="epochsInput">Epochs</label>
            <input type="text" onChange={this.updateFreeTextField('epochs',parseIntNoNaN)} value={this.state.epochs} id="epochsInput"/>

            <label htmlFor="predictInput">Predict</label>
            <input type="text" onChange={this.updateFreeTextField('testPredict')} value={this.state.testPredict} id="predictInput"/>

            <label htmlFor="generatedOutput">Output</label>
            <input type="text" style={{backgroundColor:"lightgray"}} readOnly value={this.state.testOutput} id="generatedOutput"/>
          </div>
          <div style={{display:"flex", marginTop:10}}>
            <button disabled={this.state.disableButtons} onClick={this.makeDataOC}>Generate Data</button>
            <button disabled={this.state.disableButtons} onClick={this.trainModelOC}>Train</button>
            <button disabled={this.state.disableButtons} onClick={this.predictResultOC}>Predict</button>
            <button disabled={this.state.disableButtons} onClick={this.resetModelOC}>Reset</button>
          </div>
        </div>
        <div className="dataset" style={{marginTop:10}}>
          {this.state.jsonData}
        </div>
      </div>
    );
  }
}

export default App;
