
import { makeCodeFromName, mapListHandler } from '../util/ModelUtilities';
import { parseType, parseTypes } from './Type';

class Element {
  static maps = {
    type: new Map(),
    code: new Map(),
    name: new Map(),
    id: new Map()
  };
  static typeMapHandler = mapListHandler(Element.maps.type);
  static next_id = 0;
  static fromName = (name) => Element.maps.name.has(name) ? Element.maps.name.get(name) : null;
  static fromCode = (code) => Element.maps.code.has(code) ? Element.maps.code.get(code) : null;
  static fromId = (id) => Element.maps.id.has(id) ? Element.maps.id.get(id) : null;
  static ofType = (uncheckedType) => {
    const type = parseType(uncheckedType);
    return Element.maps.type.has(type.name) ? (Element.maps.type.get(type.name)) : []
  };
  static ofTypeExcluding = (type, notType) => Element.ofType(type).filter(e => !e.hasType(notType));

  constructor(name, types) {
    this.id = Element.next_id++;
    this.name = name;
    this.code = makeCodeFromName(name);
    this.types = parseTypes(types);
    Element.maps.name.set(this.name, this);
    Element.maps.id.set(this.id, this);
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
