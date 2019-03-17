
import { makeCodeFromName } from '../util/ModelUtilities';

export const parseType = (uncheckedType) => {
  if(uncheckedType instanceof Type) {
    return uncheckedType;
  }
  return Type.maps.name.has(uncheckedType) ? Type.maps.name.get(uncheckedType) : new Type(uncheckedType);
}

export const parseTypes = (listOfUncheckedTypes) =>
  listOfUncheckedTypes.map((typeStr) => parseType(typeStr));

class Type {
  static maps = {
    name: new Map(),
    id: new Map(),
    code: new Map()
  };
  static fromName = (name) => Type.maps.name.has(name) ? Type.maps.name.get(name) : null;
  static fromCode = (code) => Type.maps.code.has(code) ? Type.maps.code.get(code) : null;
  static fromId = (id) => Type.maps.id.has(id) ? Type.maps.id.get(id) : null;
  static next_id = 0;

  constructor(name) {
    this.id = Type.next_id++;
    this.name = name;
    this.code = makeCodeFromName(name);
    Type.maps.name.set(this.name, this);
    Type.maps.id.set(this.id, this);
    Type.maps.code.set(this.code, this);
  }
}

export const NoType = new Type("none");

export default Type;
