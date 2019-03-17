
import { randomInList } from '../util/ModelUtilities';
import { NoType } from './Type';
import Element from './Element';

class HookahFlavors {
  static flavorList = [
    new Element("Watermelon Mint", ["mint", "fruit"]),
    new Element("Lemon Mint", ["mint", "citrus"]),
    new Element("Grapefruit Mint", ["mint", "citrus"]),
    new Element("Orange Mint", ["mint", "citrus", "sweet"]),
    new Element("Grape Mint", ["mint", "fruit", "sweet"]),
    new Element("Mint", ["mint", NoType]),
    new Element("Paan", ["mint", "spice"]),
    new Element("Pirate's Cove", ["spice", NoType]),
    new Element("Tropicool", ["fruit", "mint", "citrus"]),
    new Element("Peach", ["fruit", "sweet"]),
    new Element("Cherry", ["fruit", "sweet"]),
    new Element("Lemon", ["sweet", "citrus"]),
    new Element("Limoncello", ["citrus", "sweet", "cream"]),
    new Element("Strawberry", ["fruit", "sweet"]),
    new Element("Vanilla", ["cream", "sweet"]),
    new Element("Chai Tea", ["cream", "spice"]),
    new Element("Clove", ["mint", "spice"]),
    new Element("Double Apple", ["spice", "fruit"]),
    new Element("Grapefruit Paan", ["mint", "spice", "citrus"])
  ];

  static buildingLogic = {
    random: {
      name: "Random",
      code: "random",
      fn: () => [randomInList(HookahFlavors.flavorList).id, randomInList(HookahFlavors.flavorList).id]
    },
    typePairing: {
      name: "Type Pairing",
      code: "typePairing",
      fn: () => {
        let firstPick = randomInList(HookahFlavors.flavorList);
        let firstPick_randomType = randomInList(firstPick.types.filter(type=>type.id!==NoType.id));

        let secondPick;
        if(firstPick.hasType("mint")) {
          secondPick = randomInList(Element.ofTypeExcluding(firstPick_randomType, "cream"));
        } else if(firstPick.hasType("cream")) {
          secondPick = randomInList(Element.ofTypeExcluding(firstPick_randomType, "mint"));
        } else {
          secondPick = randomInList(Element.ofType(firstPick_randomType));
        }

        //5% chance of picking a random second flavor
        if(Math.random()<0.05) {
          secondPick = randomInList(Element.ofType(firstPick_randomType));
        }

        //50% chance of swapping first and second picks
        if(Math.random()>0.5) {
          const temp = firstPick;
          firstPick = secondPick;
          secondPick = temp;
        }

        return [firstPick.id, secondPick.id];
      }
    },
    typePairingWithFeatures: {
      name: "Type Pairing With Features",
      code: "typePairingWithFeatures",
      extraFeatures: true,
      fn: () => {
        let firstPick = randomInList(HookahFlavors.flavorList);
        let firstPick_randomType = randomInList(firstPick.types.filter(type=>type.id!==NoType.id));

        let secondPick;
        if(firstPick.hasType("mint")) {
          secondPick = randomInList(Element.ofTypeExcluding(firstPick_randomType, "cream"));
        } else if(firstPick.hasType("cream")) {
          secondPick = randomInList(Element.ofTypeExcluding(firstPick_randomType, "mint"));
        } else {
          secondPick = randomInList(Element.ofType(firstPick_randomType));
        }

        //5% chance of picking a random second flavor
        if(Math.random()<0.05) {
          secondPick = randomInList(Element.ofType(firstPick_randomType));
        }

        //50% chance of swapping first and second picks
        if(Math.random()<0.5) {
          const temp = firstPick;
          firstPick = secondPick;
          secondPick = temp;
        }

        return [firstPick.id, firstPick.types[0].id, firstPick.types[1].id, secondPick.id];
      }
    }
  }

  buildFlavorPairs = (numPairs=100, buildingLogic=HookahFlavors.buildingLogic.random) => {
    return [...Array(numPairs)].map(buildingLogic.fn);
  };

}

export default HookahFlavors;
