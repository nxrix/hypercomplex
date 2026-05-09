import { tables, groups } from "./tables.js";
import { renderer, camera_resize, get_mul, get_mul_table , update_shader } from "./renderer.js";

const content = document.querySelector("#content");

let n = 0;
let order = 0;
const mat = [
  0,0,0,0,
  0,0,0,0,
  0,0,0,0,
  0,0,0,0
];

// Tables & Groups

(() => {
  const groups_sorted = groups.slice().sort((a,b)=>a.length-b.length);
  for (let i = 0; i < 6; i++) {
    const orow = document.createElement("tr");
    for (let j = 0; j < 4; j++) {
      const groupIndex = i * 4 + j;
      const cell = document.createElement("td");
      cell.style.padding = "4px";
      const groupData = groups_sorted[groupIndex];
      const div = document.createElement("div");
      div.style.outline = "1px solid #333";
      div.style.padding = "8px";
      div.style.borderRadius = "8px";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.alignItems = "stretch";

      const n = groups.indexOf(groupData);
      const s = [0,1,2,3,26,27].includes(groupData[0]);

      const img = document.createElement("div");
      img.style.width = "100%";
      img.style.aspectRatio = "1";
      img.style.background = "url(./assets/img/sheet_bw_0.webp)";
      img.style.backgroundPosition = `0% calc(100%/23*${n})`;
      img.style.backgroundSize = "100% 2400%";
      if (s) img.style.filter = "sepia(1) saturate(3) hue-rotate(225deg)";
      img.style.marginBottom = "8px";
      div.appendChild(img);
      const header = document.createElement("div");
      header.textContent = `n${n+1}`+(s?" - s":"");
      header.style.textAlign = "center";
      div.appendChild(header);
      const hr = document.createElement("hr");
      hr.style.margin = "8px 0";
      hr.style.padding = "0";
      div.appendChild(hr);

      const itable = document.createElement("table");
      for (let k = 0; k < 8; k++) {
        const irow = document.createElement("tr");
        for (let m = 0; m < 4; m++) {
          const index = k * 4 + m;
          if (index<groupData.length) {
            const icell = document.createElement("td");
            icell.textContent = groupData[index];
            icell.style.padding = "0 4px";
            irow.appendChild(icell);
          }
        }
        if (irow.children.length > 0) itable.appendChild(irow);
      }
      div.appendChild(itable);
      cell.appendChild(div);
      orow.appendChild(cell);
    }
    table.appendChild(orow);
  }
  const rows = table.querySelectorAll("tr");
  rows.forEach(row => {
    const cells = Array.from(row.children);
    let max = 0;
    cells.forEach(td => {
      const div = td.querySelector("div");
      if (div) {
        div.style.height = "0px";
        max = Math.max(max,div.scrollHeight);
      }
    });
    cells.forEach(td => {
      const div = td.querySelector("div");
      if (div) div.style.height = max+"px";
    });
  });
})();

// V input

const update_v = () => {
  let v = 0;
  for (let i=0;i<16;i++) {
    if (mat[i]>0) v |= 1<<i;
  }
  vinput.value = n+v*576+order*576*65536;
  history.replaceState({},"","#"+vinput.value);
}

// 4D Order

const order_buttons = document.querySelectorAll("#orders button");
const update_orders = () => {
  order_buttons.forEach((b,i) => {
    if (i === order) {
      b.classList.add("green");
    } else {
      b.classList.remove("green");
    }
  });
}
update_orders();
order_buttons.forEach((b,i) => {
  b.onclick = () => {
    order = i;
    update_orders();
    update_v();
    update_shader(n,mat,order);
  }
});

// Sign Labels

const update_sign_labels = () => {
  for (let i=0;i<16;i++) {
    const btn = signs.children[i];
    btn.textContent = (mat[i]?"-":"+")+["1","i","j","k"][tables[n][i]];
    btn.className = mat[i]?"red":"blue";
  }
}

// N input

prev.onclick = () => {
  n = Math.max(n-1,0);
  ninput.value = n;
  update_sign_labels();
  update_v();
  update_shader(n,mat,order);
}

next.onclick = () => {
  n = Math.min(n+1,575);
  ninput.value = n;
  update_sign_labels();
  update_v();
  update_shader(n,mat,order);
}

ninput.addEventListener("input",()=>{
  n = Math.min(Math.max(parseInt(ninput.value)||0,0),575);
  update_sign_labels();
  update_v();
  update_shader(n,mat,order);
});

// Signs

for (let i=0;i<16;i++) {
  const btn = document.createElement("button");
  btn.textContent = (mat[i]?"-":"+")+["1","i","j","k"][tables[n][i]];
  btn.className = mat[i]?"red":"blue";
  btn.onclick = () => {
    mat[i] = 1-mat[i];
    btn.textContent = (mat[i]?"-":"+")+["1","i","j","k"][tables[n][i]];
    btn.className = mat[i]?"red":"blue";
    update_v();
    update_shader(n,mat,order);
  };
  signs.appendChild(btn);
}

// P input

pinput.addEventListener("input",()=>{
  update_shader(n,mat,order);
});
for (let i=2;i<=9;i++) {
  const o = document.createElement("option");
  o.value = o.text = i;
  pinput.appendChild(o);
}

// Loading

const load = (id) => {
  if (parseInt(id)) vinput.value = parseInt(id);
  const l = parseInt(vinput.value)||0;
  order = Math.floor(l/(576*65536));
  update_orders(order);
  const r = l%(576*65536);
  const v = Math.floor(r/576);
  n = r%576;
  for (let i=0;i<16;i++) {
    const btn = signs.children[i];
    const m = (v&(1<<i))!==0?1:0;
    mat[i] = m;
    btn.textContent = (m?"-":"+")+["1","i","j","k"][tables[n][i]];
    btn.className = m?"red":"blue";
  }
  ninput.value = n;
  update_v();
  update_shader(n,mat,order);
}
window.load = load;

vinput.addEventListener("input",load);
vinput.value = window.location.hash.length>2?parseInt(window.location.hash.substring(1)):91514881;
load();

const save_file = (b64,name) => {
  const link = document.createElement("a");
  link.href = b64;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const save_image = (aa = false) => {
  const z = prompt("Enter image size:");
  if (!z) return;
  const outputSize = parseInt(z) || 512;
  const factor = aa?3:1;
  const renderSize = outputSize * factor;

  const oldSize = [canvas.width,canvas.height];
  const oldPixelRatio = renderer.getPixelRatio();

  renderer.setPixelRatio(1);
  camera_resize(renderSize,renderSize);

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
  save_file(dataURL,`${vinput.value}_${new Date().toISOString().split("T")[0]}.png`);

  renderer.setPixelRatio(oldPixelRatio);
  camera_resize(oldSize[0],oldSize[1]);
}

window.save_image = save_image;

const save_shader = () => {
  const text = `// https://nxrix.github.io/hypercomplex/#${vinput.value}

//#define AA 2
//#define perspective

#define max_iter 16
#define eps 0.001
#define PI  3.1415926
#define TAU 6.2831853

/*

Square ${n}

${mat.map(v=>v?"-":"+").join("").match(/.{4}/g).join("\n")}

${get_mul_table(n,mat,order)}

*/

${get_mul(n,mat,order)}

#define s(p) p.${["xyzw","xywz","xwyz","wxyz"][order]}

// accurate but slow
/*
float f(vec3 p) {
  vec4 c = s(vec4(p,0));
  vec4 z = vec4(0);
  vec4 dx = s(vec4(1,0,0,0)); 
  vec4 dy = s(vec4(0,1,0,0));
  vec4 dz = s(vec4(0,0,1,0));
  for (int i=0;i<max_iter;i++) {
    if (dot(z,z)>16.0) break;
    dx = mul(dx,z)+mul(z,dx)+s(vec4(1,0,0,0));
    dy = mul(dy,z)+mul(z,dy)+s(vec4(0,1,0,0));
    dz = mul(dz,z)+mul(z,dz)+s(vec4(0,0,1,0));
    z = mul(z,z)+c;
  }
  float zl = length(z);
  return 0.5*zl*log(zl)/sqrt(dot(dx,dx)+dot(dy,dy)+dot(dz,dz));
}
*/

// inaccurate but fast
float f(vec3 p) {
  vec4 c = s(vec4(p,0));
  vec4 z = vec4(0);
  float d = 1.0;
  for (int i=0;i<max_iter;i++) {
    float r2 = dot(z,z);
    if (r2>16.0) break;
    vec4 z2 = mul(z,z);
    z = z2+c;
    d = 2.0*sqrt(dot(z2,z2)/max(r2,0.0001))*d+1.0;
  }
  float zl = length(z);
  return 0.5*zl*log(zl)/d;
}

// accurate
vec3 n(vec3 p) {
  vec4 c = s(vec4(p,0));
  vec4 z = vec4(0);
  vec4 dx = s(vec4(1,0,0,0)); 
  vec4 dy = s(vec4(0,1,0,0));
  vec4 dz = s(vec4(0,0,1,0));
  for (int i=0;i<max_iter;i++) {
    float r2 = dot(z,z);
    if (r2>16.0) break;
    dx = mul(dx,z)+mul(z,dx)+s(vec4(1,0,0,0));
    dy = mul(dy,z)+mul(z,dy)+s(vec4(0,1,0,0));
    dz = mul(dz,z)+mul(z,dz)+s(vec4(0,0,1,0));
    z = mul(z,z)+c;
  }
  return normalize(vec3(
    dot(z,dx),
    dot(z,dy),
    dot(z,dz)
  ));
}

// inaccurate
/*
vec3 n(vec3 p) {
  const vec2 k = vec2(1,-1)*eps;
  return normalize(
    k.xyy*f(p+k.xyy)+
    k.yyx*f(p+k.yyx)+
    k.yxy*f(p+k.yxy)+
    k.xxx*f(p+k.xxx)
  );
}
*/

mat3 lookat(vec3 ro, vec3 ta, vec3 up) {
  vec3 ww = normalize(ta-ro);
  vec3 uu = normalize(cross(ww,up));
  vec3 vv = normalize(cross(uu,ww));
  return mat3(uu,vv,ww);
}

vec2 iSphere(vec3 ro, vec3 rd, vec3 p, float r) {
  vec3 oc = ro-p;
  float b = dot(oc,rd);
  float c = dot(oc,oc)-r*r;
  float h = b*b-c;
  if (h<0.0) return vec2(16,-16);
  h = sqrt(h);
  return vec2(-b-h,-b+h);
}

void rot(inout vec2 p, float a) {
  float s = sin(a),
        c = cos(a);
  p *= mat2(c,s,-s,c);
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (2.0*fragCoord-iResolution.xy)/min(iResolution.x,iResolution.y);
  vec3 ro = vec3(0,0,3);
  rot(ro.yz,(0.5-iMouse.y)*TAU);
  rot(ro.xz,(0.25-iMouse.x)*TAU*2.0);
  mat3 cam = lookat(ro,vec3(0),vec3(0,1,0));

  #ifdef perspective
  vec3 rd = cam*normalize(vec3(uv,1));
  #else
  vec3 rd = cam*normalize(vec3(0,0,1));
  ro += cam*vec3(uv,0)*2.0;
  #endif

  vec2 b = iSphere(ro,rd,vec3(0),2.0+eps);
  if (b.x==16.0) {
    return vec4(0);
  }
  float t = max(0.0,b.x);
  for (int i=0;i<512;i++) {
    vec3 p = ro+rd*t;
    float d = f(p);
    if (d<eps) return vec4(n(p)*0.5+0.5,1);
    t += d;
    if (t>=b.y) return vec4(0);
  }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec4 col = vec4(0);
  #ifdef AA
  for(int x=0;x<AA;x++){
    for(int y=0;y<AA;y++){
      col += render(fragCoord+vec2(x,y)/float(AA));
    }
  }
  col /= float(AA*AA);
  #else
  col = render(fragCoord);
  #endif
  fragColor = col;
}
`;
  save_file("data:text/plain;base64,"+btoa(text),`${vinput.value}_${new Date().toISOString().split("T")[0]}.txt`);
}

window.save_shader = save_shader;

content.style.opacity = "1";
