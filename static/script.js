function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("word", ev.target.dataset.word);
  ev.dataTransfer.setData("emoji", ev.target.dataset.emoji);
  const { clientX, clientY } = ev;
  const { x, y } = ev.target.getBoundingClientRect();
  const offsetX = clientX - x;
  const offsetY = clientY - y;
  ev.dataTransfer.setData("offsetX", offsetX);
  ev.dataTransfer.setData("offsetY", offsetY);
}

function onDropFactory(container, elem) {
  return () => {
    if (!overlap(elem, container)) {
      elem.parentElement.removeChild(elem);
    }
    const overlapping = findOverlapping(container, elem);
    if (overlapping) {
      combineWords(elem, overlapping);
    }
  };
}

function drop(ev) {
  ev.preventDefault();
  const word = ev.dataTransfer.getData("word");
  const emoji = ev.dataTransfer.getData("emoji");
  const offsetX = ev.dataTransfer.getData("offsetX");
  const offsetY = ev.dataTransfer.getData("offsetY");
  const elem = newWord(word, emoji);
  elem.style.top = `${ev.clientY - offsetY}px`;
  elem.style.left = `${ev.clientX - offsetX}px`;
  const canvas = document.getElementById("canvas");
  const listener = onDropFactory(canvas, elem);
  makeDraggable(elem, listener);
  canvas.appendChild(elem);
  listener(); // check for immediate overlap
}

async function combineWords(elem1, elem2) {
  const first = elem1.dataset.word;
  const second = elem2.dataset.word;
  const data = { first, second };
  elem1.classList.add("resolving");
  elem2.classList.add("resolving");
  const res = await fetch("/craft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    elem1.classList.remove("resolving");
    elem2.classList.remove("resolving");
    return;
  }
  const result = await res.json();
  const { combo, first_discovery: firstDiscovery, emoji } = result;
  const container = elem1.parentElement;
  const newElem = newWord(combo, emoji);
  // average position of the two elements
  const top = (elem1.offsetTop + elem2.offsetTop) / 2;
  const left = (elem1.offsetLeft + elem2.offsetLeft) / 2;
  newElem.style.top = `${top}px`;
  newElem.style.left = `${left}px`;
  makeDraggable(newElem, onDropFactory(container, newElem));
  container.appendChild(newElem);
  container.removeChild(elem1);
  container.removeChild(elem2);
  addToPalette({ word: combo, firstDiscovery, emoji });
}

function newWord(word, emoji) {
  const el = document.createElement("div");
  el.classList.add("word");
  el.classList.add("draggable");
  el.textContent = word;
  el.dataset.word = word;
  el.dataset.emoji = emoji;
  return el;
}

function overlap(elem1, elem2) {
  const rect1 = elem1.getBoundingClientRect();
  const rect2 = elem2.getBoundingClientRect();
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function findOverlapping(container, elem) {
  const elems = container.getElementsByClassName("word");
  for (const e of elems) {
    if (e === elem) {
      continue;
    }
    if (overlap(e, elem)) {
      return e;
    }
  }
}

function makeDraggable(elem, ondrop) {
  function mouseDownHandler(e) {
    const draggable = e.target;
    if (draggable.classList.contains("resolving")) {
      return;
    }
    if (e.clientX === undefined) {
      e.clientX = e.touches[0].clientX;
      e.clientY = e.touches[0].clientY;
    }
    let offsetX = e.clientX - draggable.getBoundingClientRect().left;
    let offsetY = e.clientY - draggable.getBoundingClientRect().top;

    function mouseMoveHandler(e) {
      draggable.style.left = `${e.clientX - offsetX}px`;
      draggable.style.top = `${e.clientY - offsetY}px`;
    }

    function mouseUpHandler() {
      ondrop();
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("touchmove", mouseMoveHandler);
      document.removeEventListener("touchend", mouseUpHandler);
    }

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
    document.addEventListener("touchmove", mouseMoveHandler);
    document.addEventListener("touchend", mouseUpHandler);
  }
  elem.addEventListener("mousedown", mouseDownHandler);
  elem.addEventListener("touchstart", mouseDownHandler);
}

function handleWindowResize() {
  const CANVAS_EDGE_OFFSET = 10;
  const canvas = document.getElementById("canvas");
  const { right, bottom } = canvas.getBoundingClientRect();
  for (const elem of canvas.getElementsByClassName("word")) {
    const { right: elemRight, bottom: elemBottom, x, y } = elem.getBoundingClientRect();
    if (elemRight > right) {
      elem.style.left = `${x - (elemRight - right) - CANVAS_EDGE_OFFSET}px`;
    }
    if (elemBottom > bottom) {
      elem.style.top = `${y - (elemBottom - bottom) - CANVAS_EDGE_OFFSET}px`;
    }
  }
}

const START_WORDS = [
  { word: "air", firstDiscovery: false, emoji: "💨" },
  { word: "water", firstDiscovery: false, emoji: "💧" },
  { word: "fire", firstDiscovery: false, emoji: "🔥" },
  { word: "earth", firstDiscovery: false, emoji: "🌍" },
]
const lastWords = JSON.parse(localStorage.getItem("words") || "[]");
if (lastWords.length === 0) {
  localStorage.setItem("words", JSON.stringify(START_WORDS));
}
const words = [];
const INIT_WORDS = JSON.parse(localStorage.getItem("words"));

function addToPalette({ word, firstDiscovery = false, emoji = "❔" }) {
  if (words.some(({ word: w }) => w === word)) {
    return;
  }
  words.push({ word, firstDiscovery, emoji });
  localStorage.setItem("words", JSON.stringify(words));
  const palette = document.getElementById("palette");
  const elem = newWord(word, emoji);
  elem.classList.remove("draggable");
  if (firstDiscovery) {
    elem.classList.add("first-discovery");
  }
  elem.draggable = true;
  elem.ondragstart = (ev) => drag(ev);
  palette.appendChild(elem);
}

function init() {
  window.addEventListener("resize", handleWindowResize);
  for (const { word, firstDiscovery, emoji } of INIT_WORDS) {
    addToPalette({ word, firstDiscovery, emoji });
  }
}

document.addEventListener("DOMContentLoaded", init);
