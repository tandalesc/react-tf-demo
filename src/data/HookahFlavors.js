
const randomInList = (list) => list[Math.floor(Math.random()*list.length)];

const mapListHandler = (map) => new Proxy(map, {
  set: (obj, prop, val) => {
    if(!obj.has(prop)) {
      obj.set(prop, [val]);
    } else {
      obj.get(prop).push(val);
    }
    return true;
  }
});

export class Flavor {
  static maps = {
    type: new Map(),
    name: new Map(),
    index: new Map()
  };
  static mapTypeHandler = mapListHandler(Flavor.maps.type);
  static ofType = (type) => Flavor.maps.type.has(type) ? (Flavor.maps.type.get(type)) : [];
  static ofTypeWithout = (type, notType) => Flavor.ofType(type).filter(t => !t.hasType(notType));
  static count = 0;
  types = [];
  constructor(name, flavorTypes) {
    this.index = Flavor.count++;
    this.name = name;
    for(const type of flavorTypes) {
      this.addType(type);
      Flavor.maps.name.set(this.name, this);
      Flavor.maps.index.set(this.index, this);
    }
  }
  addType = (type) => {
    if(!this.hasType(type)) {
      this.types.push(type);
      Flavor.mapTypeHandler[type] = this;
    }
  };
  hasType = (type) => this.types.includes(type);
}

class HookahFlavors {
  flavorList = [
    new Flavor("Watermelon Mint", ["mint", "fruit", "sweet"]),
    new Flavor("Lemon Mint", ["mint", "fruit", "tart"]),
    new Flavor("Grape Mint", ["mint", "fruit", "sweet"]),
    new Flavor("Mint", ["mint"]),
    new Flavor("Paan", ["mint", "spice"]),
    new Flavor("Pirate's Cove", ["spice"]),
    new Flavor("Tropicool", ["fruit", "mint", "sweet"]),
    new Flavor("Peach", ["fruit", "sweet"]),
    new Flavor("Mango", ["fruit", "sweet"]),
    new Flavor("Lemon", ["fruit", "tart"]),
    new Flavor("Strawberry", ["fruit", "sweet"]),
    new Flavor("Vanilla", ["cream", "sweet"]),
    new Flavor("Chai Tea", ["cream", "spice"]),
    new Flavor("Double Apple", ["spice", "fruit"])
  ];

  constructor() {
    console.log(Flavor.maps);
  }

  randomBuildingLogic = () => [randomInList(this.flavorList).index, randomInList(this.flavorList).index];

  typePairingBuildingLogic = () => {
    const firstPick = randomInList(this.flavorList);
    let firstPick_randomType = randomInList(firstPick.types);
    let secondPick;
    if(firstPick.hasType("mint")) {
      secondPick = randomInList(Flavor.ofTypeWithout(firstPick_randomType, "cream"));
    } else if(firstPick.hasType("cream")) {
      secondPick = randomInList(Flavor.ofTypeWithout(firstPick_randomType, "mint"));
    } else {
      secondPick = randomInList(Flavor.ofType(firstPick_randomType));
    }
    return [firstPick.index, secondPick.index];
  }

  buildFlavorPairs = (numPairs=100,buildingLogic=this.randomBuildingLogic) => {
    return [...Array(numPairs)].map(buildingLogic);
  };

}

export default HookahFlavors;
