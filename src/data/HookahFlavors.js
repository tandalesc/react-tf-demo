
const randomInList = (list) => Math.floor(Math.random()*list.length);

class HookahFlavors {
  flavorList = [
    "Watermelon Mint",
    "Grape Mint",
    "Mint",
    "Lemon Mint",
    "Paan",
    "Pirate's Cove",
    "Tropicool",
    "Sex on the Beach",
    "Blue Mist",
    "Peach",
    "Strawberry",
    "Vanilla",
    "Double Apple"
  ];

  buildFlavorPairs = (numPairs=100) => {
    return [...Array(numPairs)].map((_) => (
      [randomInList(this.flavorList), randomInList(this.flavorList)]
    ));
  };

  getFlavorTranslationMaps = () => {
    let count = 0;
    const forwardMap = new Map();
    const backwardMap = new Map();
    for(const flavor of this.flavorList) {
      forwardMap.set(flavor, count);
      backwardMap.set(count, flavor);
      count++;
    }
    return {forward: forwardMap, backward: backwardMap};
  };

}

export default HookahFlavors;
