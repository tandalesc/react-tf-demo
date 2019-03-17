
import Model from './Model.js';

class AsymmetricPairMatching extends Model {
  model = null;
  xs = null;
  ys = null;
  logRecorder = null;
  numCategories = 1;

  constructor(tf, {
      numCategories,
      numFeatures,
      logRecorder=console.log,
      adaptNeuronCount=true,
      numLayers=3,
      dropout=0.1,
      validationSplit=0.25
    }) {
    super("Asymmetric Pair Matching", tf);
    this.logRecorder = logRecorder;
    this.numCategories = numCategories;
    this.numFeatures = numFeatures;
    this.adaptNeuronCount = adaptNeuronCount;
    this.vectorBlockSize = Math.max(this.numCategories, this.numFeatures);
    this.dropout = dropout;
    this.validationSplit = validationSplit;
    this.numLayers = numLayers;
  }

  buildModel(inputShape = [this.vectorBlockSize]) {
    //Simple Model
    this.model = this.tf.sequential();
    const layerUnits = [...Array(this.numLayers)].map((_,i)=>{
      return Math.floor(inputShape[0] - inputShape[0]*(i/(this.numLayers-1)) + this.vectorBlockSize);
    });
    for(let layer = 0; layer < this.numLayers; layer++) {
      this.model.add(this.tf.layers.dense({units: layerUnits[layer], activation: 'softplus', inputShape: inputShape}));
      this.model.add(this.tf.layers.dropout({rate: this.dropout}));
    }
    //Categorical, so we need to end in a softmax
    this.model.add(this.tf.layers.softmax());
    this.model.summary();

    this.model.compile({
      //adam converges faster than sgd
      optimizer: 'adam',
      //multiclass categorical prediction using softmax
      loss: 'categoricalCrossentropy'
    });
  }

  predict(input) {
    return this.model.predict(this.tf.oneHot(input, this.numCategories).reshape([-1, this.vectorBlockSize*3]));
  }

  trainModel(xs, ys, {batchSize,epochs,validationSplit=this.validationSplit}) {
    const inputShape = this.vectorBlockSize*3;
    xs = this.tf.oneHot(xs, this.vectorBlockSize).reshape([-1, inputShape]);
    ys = this.tf.oneHot(ys, this.vectorBlockSize);

    this.buildModel([inputShape]);
    return this.model.fit(xs, ys, {
      batchSize: batchSize,
      epochs: epochs,
      shuffle: true,
      validationSplit: validationSplit,
      callbacks: {
        onEpochEnd: this.logRecorder
      }
    });
  }
}

export default AsymmetricPairMatching;
