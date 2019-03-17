
import { makeCodeFromName, mapListHandler } from '../util/ModelUtilities';
import { parseType, parseTypes } from './Type';

class Element {
  static maps = {
    type: new Map(),
    code: new Map(),
    name: new Map(),
    index: new Map()
  };
  static typeMapHandler = mapListHandler(Element.maps.type);
  static count = 0;
  static fromName = (name) => Element.maps.name.has(name) ? Element.maps.name.get(name) : null;
  static fromCode = (code) => Element.maps.code.has(code) ? Element.maps.code.get(code) : null;
  static fromIndex = (index) => Element.maps.index.has(index) ? Element.maps.index.get(index) : null;
  static ofType = (uncheckedType) => {
    const type = parseType(uncheckedType);
    return Element.maps.type.has(type.name) ? (Element.maps.type.get(type.name)) : []
  };
  static ofTypeExcluding = (type, notType) => Element.ofType(type).filter(e => !e.hasType(notType));

  constructor(name, types) {
    this.index = Element.count++;
    this.name = name;
    this.code = makeCodeFromName(name);
    this.types = parseTypes(types);
    Element.maps.name.set(this.name, this);
    Element.maps.index.set(this.index, this);
    Element.maps.code.set(this.code, this);
    this.types.forEach((type) => {
      Element.typeMapHandler[type.name] = this;
    });
  }

  hasType = (uncheckedType) => {
    const type = parseType(uncheckedType);
    return type && this.types.includes(type);
  }
}

export default Element;
