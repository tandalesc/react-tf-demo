
class PairMatching {
  tf = null;
  model = null;
  xs = null;
  ys = null;
  logRecorder = null;
  numCategories = 1;

  constructor(tf, numCategories, logRecorder=console.log) {
    this.tf = tf;
    this.logRecorder = logRecorder;
    this.numCategories = numCategories;
    this.buildModel();
  }

  buildModel() {
    //Simple Model
    this.model = this.tf.sequential();
    this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'relu', inputShape: [this.numCategories]}));
    this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'relu', inputShape: [this.numCategories]}));
    this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'relu', inputShape: [this.numCategories]}));
    this.model.add(this.tf.layers.dense({units: this.numCategories, activation: 'linear'}));
    this.model.summary();
    this.model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});
  }

  predict(input) {
    return this.model.predict(this.tf.oneHot(input, this.numCategories));
  }

  trainModel(io_data,batchSize=20,epochs=100) {
    let xs, ys;
    if(io_data) {
      [xs, ys] = this.tf.split(io_data, 2, 1);
      xs = this.tf.unstack(xs.transpose())[0];
      ys = this.tf.unstack(ys.transpose())[0];
    } else {
      xs = this.tf.multinomial(this.tf.range(0,this.numCategories),200);
      ys = this.tf.multinomial(this.tf.range(0,this.numCategories),200);
    }

    xs = this.tf.oneHot(xs, this.numCategories);
    ys = this.tf.oneHot(ys, this.numCategories);

    return this.model.fit(xs, ys, {
      batchSize: batchSize,
      epochs: epochs,
      shuffle: true,
      callbacks: {
        onEpochEnd: this.logRecorder
      }
    });
  }
}

export default PairMatching;
