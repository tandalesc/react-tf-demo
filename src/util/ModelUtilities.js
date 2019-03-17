
export const makeCodeFromName = (name) =>
  name.split(' ')
  .map((word,i)=>{
    if(i===0) return word.toLowerCase(); //first word is lower-case
    else return word.slice(0,1).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');

export const randomInList = (list) => list[Math.floor(Math.random()*list.length)];

export const mapListHandler = (map) => new Proxy(map, {
  set: (obj, prop, val) => {
    if(!obj.has(prop)) {
      obj.set(prop, [val]);
    } else {
      obj.get(prop).push(val);
    }
    return true;
  }
});
