
class PairMatching {
  tf = null;
  model = null;
  xs = null;
  ys = null;
  logRecorder = null;
  numCategories = 1;

  constructor(tf, {numCategories, logRecorder=console.log, numLayers=3, dropout=0.1, validationSplit=0.25}) {
    this.tf = tf;
    this.logRecorder = logRecorder;
    this.numCategories = numCategories;
    this.dropout = dropout;
    this.validationSplit = validationSplit;
    this.numLayers = numLayers;
    this.buildModel();
  }

  buildModel() {
    //Simple Model
    this.model = this.tf.sequential();
    for(let layer = 0; layer < this.numLayers; layer++) {
      this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'softplus', inputShape: [this.numCategories]}));
      this.model.add(this.tf.layers.dropout({rate: this.dropout}));
    }
    //Categorical, so we need to end in a softmax
    this.model.add(this.tf.layers.softmax());
    this.model.summary();
    //adam converges faster than sgd
    this.model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy'});
  }

  predict(input) {
    return this.model.predict(this.tf.oneHot(input, this.numCategories));
  }

  trainModel(io_data,{batchSize,epochs,validationSplit=this.validationSplit}) {
    let xs, ys;
    if(io_data) {
      [xs, ys] = this.tf.split(io_data, 2, 1);
      xs = this.tf.unstack(xs.transpose())[0];
      ys = this.tf.unstack(ys.transpose())[0];
    } else {
      console.log("GENERATING RANDOM DATA");
      xs = this.tf.multinomial(this.tf.range(0,this.numCategories),200);
      ys = this.tf.multinomial(this.tf.range(0,this.numCategories),200);
    }

    xs = this.tf.oneHot(xs, this.numCategories);
    ys = this.tf.oneHot(ys, this.numCategories);

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

export default PairMatching;
