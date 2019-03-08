import React, { Fragment, Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import PairMatchingModel from './models/PairMatching';
import HookahFlavors from './data/HookahFlavors';

import './App.css';

const parseIntNoNaN = (str) => str === '' ? 0 : parseInt(str);

class App extends Component {
  state = {
    trainingLog: [],
    dataSize: 200,
    batchSize: 10,
    epochs: 25,
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
    const data = this.data.hookahFlavorPairs ? this.data.hookahFlavorPairs : null;
    this.setState({disableButtons: true});
    this.models.pairMatching.trainModel(data, this.state.batchSize, this.state.epochs)
      .then(()=>{
        this.setState({disableButtons: false});
      })
  };

  makeDataOC = () => {
    const flavorPairs = this.data.hookahFlavors.buildFlavorPairs(this.state.dataSize);
    const translationMaps = this.data.hookahFlavors.getFlavorTranslationMaps();
    const translatedPairs = flavorPairs.map(([p1,p2])=>(`${translationMaps.backward.get(p1)} - ${translationMaps.backward.get(p2)}`)).sort();

    this.setState({jsonData: (
      <Fragment>
        {translatedPairs.map((e)=>(<Fragment>{e}<br/></Fragment>))}
      </Fragment>
    )});
  };

  predictResultOC = () => {
    const {forward, backward} = this.data.hookahFlavors.getFlavorTranslationMaps();
    if(forward.has(this.state.testPredict)) {
      const predictionIndex = forward.get(this.state.testPredict);
      const prediction = this.models.pairMatching.predict(tf.tensor([predictionIndex],[1],'int32'));
      const closestMatch = tf.argMax(tf.unstack(prediction)[0]);
      const jsValue = Array.from(closestMatch.dataSync())[0];
      this.setState({
        testOutput:backward.get(jsValue),
        trainingLog: Array.from(tf.unstack(prediction)[0].dataSync())
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
                <td>{this.data.hookahFlavors.flavorList[i]}</td>
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
