
import Model from './Model';

class SymmetricPairMatching extends Model {
  model = null;
  xs = null;
  ys = null;
  logRecorder = null;
  numCategories = 1;

  constructor(tf, {numCategories, logRecorder=console.log, numLayers=3, dropout=0.1, validationSplit=0.25}) {
    super("Symmetric Pair Matching", tf);
    this.tf = tf;
    this.logRecorder = logRecorder;
    this.numCategories = numCategories;
    this.dropout = dropout;
    this.validationSplit = validationSplit;
    this.numLayers = numLayers;
  }

  buildModel(inputShape = [this.numCategories]) {
    //Simple Model
    this.model = this.tf.sequential();
    for(let layer = 0; layer < this.numLayers; layer++) {
      this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'softplus', inputShape: inputShape}));
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
    return this.model.predict(this.tf.oneHot(input, this.numCategories));
  }

  trainModel(xs, ys, {batchSize, epochs, validationSplit=this.validationSplit}) {
    const inputShape = this.numCategories;
    xs = this.tf.oneHot(xs, inputShape);
    ys = this.tf.oneHot(ys, this.numCategories);

    this.buildModel(inputShape);
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

export default SymmetricPairMatching;
