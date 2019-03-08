
const randomInList = (list) => Math.floor(Math.random()*list.length);

export const buildMapFromPairs = (flavorPairs) => {
  const map = new Map();
  for(const [f1,f2] of flavorPairs) {
    if(!map.has(f1)) {
      map.set(f1, []);
    }
    const existingEntry = map.get(f1).find((e)=>e.flavor===f2);
    if(existingEntry) {
      existingEntry.count++;
    } else {
      map.get(f1).push({flavor:f2, count: 1});
    }
  }
  return map;
};

class HookahFlavors {
  flavorList = [
    "Watermelon Mint",
    "Grape Mint",
    "Mint",
    "Paan",
    "Tropicool",
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
