console.log("Muahaha, I've taken over the world!");

// From https://stackoverflow.com/a/49663134
const getCssSelectorShort = el => {
  let path = [];
  let parent;
  while ((parent = el.parentNode)) {
    let tag = el.tagName, siblings;
    path.unshift(
      el.id
        ? `#${el.id}`
        : ((siblings = parent.children),
          [].filter.call(siblings, sibling => sibling.tagName === tag)
            .length === 1
            ? tag
            : `${tag}:nth-child(${1 + [].indexOf.call(siblings, el)})`)
    );
    el = parent;
  }

  return `${path.join(' > ')}`.toLowerCase();
}

let dragCounter = 0;
document.body.addEventListener("mousedown", (e) => {
    console.log(e.target);
    console.log(`x: ${e.clientX} y: ${e.clientY}`);
    const el = e.target;

    const anchor = { x: e.clientX, y: e.clientY };
    const ourDragCount = dragCounter++;

    // TODO: test the following to fix sequential translations
    /*
    if (el.style.transform) {
        const parts = el.style.transform.match(/translate\((\d+)px, (\d+)px\)/);
        if (parts) {
            anchor.x += parseInt(parts[1]);
            anchor.y += parseInt(parts[2]); 
        }
    }
    */

    const onMouseMove = (e) => {
        const currentPos = { x: e.clientX, y: e.clientY };
        const point = { x: currentPos.x - anchor.x, y: currentPos.y - anchor.y };
        console.log(`point x: ${point.x} point y: ${point.y} (${ourDragCount})`);
        addChange(el, { type: "transform", data: { point } })
        applyTransform(el, { point })
    }

    document.body.addEventListener("mousemove", onMouseMove);

    document.body.addEventListener("mouseup", (e) => {
        document.body.removeEventListener("mousemove", onMouseMove);
    }, { once: true });
    
})

const applyTransform = (el, { point }) => el.style.transform = `translate(${point.x}px, ${point.y}px)`;

// TODO: Right now when we call addChanges, it just appends onto a giant list.
const key = "My changes";
const addChange = (el, change) => {
    let allChanges = localStorage.getItem(key);
    if (allChanges == null) {
        allChanges = {};
    } else {
      allChanges = JSON.parse(allChanges);
    }
    
    // TODO: In order to support different pages on the same domain, 
    // we should probably separate these by exact URL (document.location)
    const uniqueSelector = getCssSelectorShort(el);

    let changesForSelector = allChanges[uniqueSelector]; 
    if (!changesForSelector) {
        changesForSelector = [];
        allChanges[uniqueSelector] = changesForSelector; 
    }
    changesForSelector.push(change);
    localStorage.setItem(key, JSON.stringify(allChanges));
}

// When doc loads:
let allChanges = localStorage.getItem(key);
if (allChanges) {
    allChanges = JSON.parse(allChanges);
    Object.entries(allChanges).forEach(([selector, changes]) => {
        const el = document.querySelector(selector);
        if (!el) throw Error(`No element found for selector '${selector}'`);
        const lastChangesByType = {};
        changes.forEach(({ type, data }) => {
            lastChangesByType[type] = data;
        });

        Object.entries(lastChangesByType).forEach(([type, data]) => {
            switch(type) {
                case "transform":
                    applyTransform(el, data);
                    break;
                default: 
                    throw new Error(`Unexpected change type '${type}'`);
            }
        })
    })
}
