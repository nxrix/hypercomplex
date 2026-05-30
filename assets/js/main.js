import { tables } from "./tables.js";
import { shaderShadertoy } from "./shader.js";
import { renderer, cameraResize, getMul, getMulTable , updateShader, setJuliaUniform } from "./renderer.js";

import "./groups.js";

const state = { n: 0, s: 0, p: 2, j: false, c: [0,0,0,0] , m: new Array(16).fill(0) };

const sliceButtons = document.querySelectorAll("#slices button");

const updateURL = () => {
  const v = state.m.reduce((a,b,i)=>a|(b<<i),0);
  const packed = state.n+v*576+state.s*576*65536;
  const params = new URLSearchParams();
  params.set("v",packed);
  params.set("p",state.p);
  if (state.j) {
    params.set("j",state.c.join(","));
  }
  history.replaceState({}, "", "?" + params.toString());
  vinput.value = packed;
}

const updateState = (k=false) => {
  sliceButtons.forEach((b,i) => {
    b.classList.toggle("green",i===state.s);
  });
  Array.from(signs.children).forEach((b,i) => {
    const v = tables[state.n][i];
    const m = state.m[i];
    b.textContent = (m?"-":"+")+["1","i","j","k"][v];
    b.className = m?"red":"blue";
  });
  if (!k) ninput.value = state.n;
  updateURL();
  updateShader(state);
}

// Slice

sliceButtons.forEach((b,i) => {
  b.onclick = () => { state.s = i; updateState(); };
});

// N input

prev.onclick = () => { state.n = Math.max(state.n-1,  0); updateState(); };
next.onclick = () => { state.n = Math.min(state.n+1,575); updateState(); };
ninput.addEventListener("input", () => {
  state.n = Math.min(Math.max(parseInt(ninput.value)||0,0),575);
  updateState(true);
});

// Signs

for (let i=0;i<16;i++) {
  const b = document.createElement("button");
  b.onclick = () => {
    state.m[i] = 1-state.m[i];
    updateState();
  };
  signs.appendChild(b);
}

// P input

pinput.addEventListener("input", () => {
  state.p = parseInt(pinput.value);
  updateURL();
  updateShader(state);
});
for (let i=2;i<=9;i++) {
  const o = document.createElement("option");
  o.value = o.text = i;
  pinput.appendChild(o);
}

// Julia Mode

juliaMode.addEventListener("change", () => {
  const c = juliaMode.checked;
  juliaControls.style.display = c?"flex":"none";
  state.j = c;
  updateURL();
  updateShader(state);
});

for (let i=0;i<4;i++) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "4px";
  row.style.width = "fit-content";

  const num = document.createElement("input");
  num.style.textAlign = "center";
  num.type = "number";
  num.min = -2;
  num.max = 2;
  num.step = 0.01;
  num.value = 0;

  const range = document.createElement("input");
  range.type = "range";
  range.min = -2;
  range.max = 2;
  range.step = 0.01;
  range.value = 0;

  const update = (i,v) => {
    if (isNaN(parseFloat(val))) return;
    num.value = v;
    range.value = v;
    state.c[i] = v;
    updateURL();
    setJuliaUniform(i,v);
  }

  num.addEventListener("input",()=>update(i,num.value));
  range.addEventListener("input",()=>update(i,range.value));

  row.appendChild(num);
  row.appendChild(range);
  juliaControls.appendChild(row);
}

// Loading

const loadFromHash = (hash) => {
  const val = parseInt(hash)||53766148;
  vinput.value = val;
  const l = val;
  state.s = Math.floor(l / (576 * 65536));
  const r = l % (576 * 65536);
  const v = Math.floor(r / 576);
  state.n = r % 576;
  for (let i = 0; i < 16; i++) state.m[i] = (v >> i) & 1;
  updateState();
}
vinput.addEventListener("input",()=>loadFromHash(vinput.value));
window.load = loadFromHash;

const params = new URLSearchParams(window.location.search);
loadFromHash(params.get("v"));
if (params.has("p")) {
  state.p = parseInt(params.get("p")) || 2;
  pinput.value = state.p;
}
state.j = params.has("j");
juliaMode.checked = state.j;
juliaControls.style.display = state.j?"flex":"none";
if (state.j) {
  const c = params.get("j").split(",").map(Number);
  for (let i=0;i<4;i++) {
    const r = juliaControls.children[i].children;
    state.c[i] = r[0].value = r[1].value = c[i]??0;
    setJuliaUniform(i,state.c[i]);
  }
}
updateURL();
updateShader(state);

const saveFile = (b64,name) => {
  const link = document.createElement("a");
  link.href = b64;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const saveImage = (aa = false) => {
  const z = prompt("Enter image size:");
  if (!z) return;
  const outputSize = parseInt(z) || 512;
  const factor = aa?3:1;
  const renderSize = outputSize * factor;

  const oldSize = [canvas.width,canvas.height];
  const oldPixelRatio = renderer.getPixelRatio();

  renderer.setPixelRatio(1);
  cameraResize(renderSize,renderSize);

  const gl = renderer.getContext();
  const pixels = new Uint8Array(renderSize * renderSize * 4);
  gl.readPixels(0, 0, renderSize, renderSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  const outPixels = new Uint8Array(outputSize * outputSize * 4);
  const ks = factor;
  const ks2 = ks * ks;
  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < ks; dy++) {
        for (let dx = 0; dx < ks; dx++) {
          const sx = x * ks + dx;
          const sy = (renderSize-1)-(y*ks+dy);
          const idx = (sy * renderSize + sx) * 4;
          r += pixels[idx];
          g += pixels[idx + 1];
          b += pixels[idx + 2];
          a += pixels[idx + 3];
        }
      }
      const outIdx = (y * outputSize + x) * 4;
      outPixels[outIdx]     = r / ks2;
      outPixels[outIdx + 1] = g / ks2;
      outPixels[outIdx + 2] = b / ks2;
      outPixels[outIdx + 3] = a / ks2;
    }
  }

  const offCanvas = document.createElement("canvas");
  offCanvas.width = outputSize;
  offCanvas.height = outputSize;
  const ctx = offCanvas.getContext("2d");
  const imageData = ctx.createImageData(outputSize, outputSize);
  imageData.data.set(outPixels);
  ctx.putImageData(imageData, 0, 0);

  const dataURL = offCanvas.toDataURL("image/png");
  saveFile(dataURL,`${vinput.value}_${new Date().toISOString().split("T")[0]}.png`);

  renderer.setPixelRatio(oldPixelRatio);
  cameraResize(oldSize[0],oldSize[1]);
}

window.saveImage = saveImage;

const saveShader = () => {
  const text = shaderShadertoy
    .replace("//--link--//",`https://nxrix.github.io/hypercomplex/?v=${vinput.value}`)
    .replace("//--info--//",
      `Square ${state.n}\n\n`+
      `${state.m.map(v=>v?"-":"+").join("").match(/.{4}/g).join("\n")}\n\n`+
      `${getMulTable(state)}`
    )
    .replace("//--input--//",
      `${getMul(state)}\n\n`+
      `#define s(p) p.${["xyzw","xywz","xwyz","wxyz"][state.s]}`
    );
  saveFile("data:text/plain;base64,"+btoa(text),`${vinput.value}_${new Date().toISOString().split("T")[0]}.txt`);
}

window.saveShader = saveShader;

content.style.opacity = "1";
