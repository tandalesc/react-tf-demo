
import { makeCodeFromName } from '../util/ModelUtilities';

class Model {
  static next_id = 0;
  constructor(name, tf) {
    this.name = name;
    this.code = makeCodeFromName(name);
    this.id = Model.next_id++;
    this.tf = tf;
  }

  async saveModel(fileName) {
    if(fileName) {
      await this.model.save(`localstorage://tf-models/${fileName}`);
    }
  }

  async loadModel(fileName) {
    if(fileName) {
      this.model = await this.tf.loadLayersModel(`localstorage://tf-models/${fileName}`);
    }
  }
}

export default Model;
