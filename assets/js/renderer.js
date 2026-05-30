import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { tables } from "./tables.js";
import { shaderRaw } from "./shader.js";

const getMul = (state) => {
  const a = tables[state.n];
  const comps = ["x","y","z","w"];
  const sums = { 0: [], 1: [], 2: [], 3: [] };
  for (let i=0;i<16;i++) {
    const term = `${state.m[i]?"-":"+"}a.${comps[Math.floor(i/4)]}*b.${comps[i%4]}`;
    sums[a[i]].push(term);
  }
  let glsl = "vec4 mul(vec4 a, vec4 b) {\n";
  glsl += "  return vec4(\n";
  for (let r=0;r<4;r++) {
    const terms = sums[r];
    let s;
    if (terms.length === 0) {
      s = "0.0";
    } else if (terms.length === 1) {
      s = terms[0];
    } else {
      s = terms.join(" + ");
    }
    glsl += `    ${s}`;
    if (r < 3) glsl += ",";
    glsl += "\n";
  }
  glsl += "  );\n";
  glsl += "}";
  return glsl;
}

const getMulTable = (state) => {
  const b = tables[state.n].map(i=>["1","i","j","k"][i]);
  const m = state.m.map(i=>i?"-":" ");
  let table = " × | 1 | i | j | k \n";
     table += "---|---|---|---|---\n";
     table += ` 1 |${m[ 0]}${b[ 0]} |${m[ 1]}${b[ 1]} |${m[ 2]}${b[ 2]} |${m[ 3]}${b[ 3]} \n`;
     table += "---|---|---|---|---\n";
     table += ` i |${m[ 4]}${b[ 4]} |${m[ 5]}${b[ 5]} |${m[ 6]}${b[ 6]} |${m[ 7]}${b[ 7]} \n`;
     table += "---|---|---|---|---\n";
     table += ` j |${m[ 8]}${b[ 8]} |${m[ 9]}${b[ 9]} |${m[10]}${b[10]} |${m[11]}${b[11]} \n`;
     table += "---|---|---|---|---\n";
     table += ` k |${m[12]}${b[12]} |${m[13]}${b[13]} |${m[14]}${b[14]} |${m[15]}${b[15]} `;
  return table;
}

const getDerivative = (n,d) => {
  const t = [];
  for (let i = 0; i < n; i++) {
    const o = Array(n).fill("z");
    o[i] = d;
    let e = o[0];
    for (let j = 1; j < n; j++) {
      e = `mul(${e},${o[j]})`;
    }
    t.push(e);
  }
  return t.join("+");
}

const getShader = (state) => {
  const p = state.p;
  const j = state.j;
  const a0 = state.iabsz;
  const a1 = state.iabszn;
  return shaderRaw.replace("//--input--//",
    (j?"#define julia\n\n":"")+
    (a0?"#define iabsz\n\n":"")+
    (a1?"#define iabszn\n\n":"")+
    (!(j||a0||a1)?"#define accurate_n\n\n":"")+
    `${getMul(state)}\n`+
    `#define s(p) p.${["xyzw","xywz","xwyz","wxyz"][state.s]}\n`
  ).replaceAll("//--derivative--//",
    `dx = ${getDerivative(p,"dx")}${j?"":"+s(vec4(1,0,0,0))"};\n`+
    `dy = ${getDerivative(p,"dy")}${j?"":"+s(vec4(0,1,0,0))"};\n`+
    `dz = ${getDerivative(p,"dz")}${j?"":"+s(vec4(0,0,1,0))"};`
  ).replaceAll("//--power--//",[...Array(p-1)].reduce((a,_)=>`mul(${a},z)`,"z")).replace("//--power_number--//",p+".0");
}

const renderer = new THREE.WebGLRenderer({ canvas, context: canvas.getContext("webgl2",{ antialias: false, preserveDrawingBuffer: true }) });
renderer.setSize(512,512,false);
renderer.setPixelRatio(window.devicePixelRatio);
canvas.style.width = canvas.style.height = 512;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const perspectiveCamera = new THREE.PerspectiveCamera(45,1,0.125,256);
const orthographicCamera = new THREE.OrthographicCamera(-2,2,2,-2,0.125,256);
perspectiveCamera.position.set(0,0,4);
orthographicCamera.position.set(0,0,4);
let camera = orthographicCamera;

const scene = new THREE.Scene();

const vs = `
varying vec3 vP;
varying vec3 vW;
varying vec3 vN;
varying mat4 vM;
void main() {
  vP = position;
  vN = normal;
  vW = (modelMatrix*vec4(position,1)).xyz;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1);
  vM = projectionMatrix*modelViewMatrix;
}`;

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(4,4,4),
  new THREE.ShaderMaterial({
    vertexShader: vs,
    uniforms: {
      perspective: { value: false },
      julia: { value: false },
      iJ: { value: new THREE.Vector4(0,0,0,0) }
    },
    side: THREE.DoubleSide
  })
);
cube.frustumCulled = false;
scene.add(cube);

const cameraResize = (w,h) => {
  renderer.setSize(w,h,false);
  canvas.style.width = w;
  canvas.style.height = h;
  
  const aspect = w/h;

  perspectiveCamera.aspect = aspect;
  perspectiveCamera.zoom = aspect<=1?aspect:1;
  perspectiveCamera.updateProjectionMatrix();

  if (aspect<=1) {
    const visibleHeight = orthographicCamera.left - orthographicCamera.right;
    orthographicCamera.top = -visibleHeight/aspect/2;
    orthographicCamera.bottom = visibleHeight/aspect/2;
  } else {
    const visibleHeight = orthographicCamera.top - orthographicCamera.bottom;
    orthographicCamera.left = -visibleHeight*aspect/2;
    orthographicCamera.right = visibleHeight*aspect/2;
  }
  orthographicCamera.updateProjectionMatrix();

  renderer.render(scene,camera);
}
//window.addEventListener("resize",()=>cameraResize(window.innerWidth,window.innerHeight));
//cameraResize(window.innerWidth,window.innerHeight);

let needsRender = true;
const controls = new OrbitControls(camera,renderer.domElement);
controls.addEventListener("change",() => { needsRender = true; });
const update = () => {
  if (needsRender) {
    renderer.render(scene,camera);
    needsRender = false;
  }
  requestAnimationFrame(update);
}
update();

const updateShader = (state) => {
  cube.material.fragmentShader = getShader(state);
  cube.material.needsUpdate = true;
  needsRender = true;
}

cameraFov.addEventListener("input",() => {
  perspectiveCamera.fov = cameraFov.value;
  perspectiveCamera.updateProjectionMatrix();
  needsRender = true;
});

cameraType.addEventListener("change", () => {
  fovContainer.style.display = cameraType.checked?"block":"none";

  const target = controls.target.clone();
  const position = camera.position.clone();

  const aspect = canvas.width / canvas.height;
  const halfFovRad = perspectiveCamera.fov * Math.PI / 360;
  if (cameraType.checked) {
    const visibleHeight = (aspect<=1?(orthographicCamera.right-orthographicCamera.left):(orthographicCamera.top-orthographicCamera.bottom))/orthographicCamera.zoom;
    const newDistance = visibleHeight / (2 * Math.tan(halfFovRad));
    const direction = new THREE.Vector3().subVectors(position,target).normalize();
    const newPosition = target.clone().add(direction.multiplyScalar(newDistance));
    perspectiveCamera.position.copy(newPosition);
    perspectiveCamera.updateProjectionMatrix();

    camera = perspectiveCamera;
    cube.material.uniforms.perspective.value = true;
  } else {
    const distance = position.distanceTo(target);
    const visibleHeight = 2 * distance * Math.tan(halfFovRad);

    orthographicCamera.position.copy(position);
    if (aspect<=1) {
      orthographicCamera.top = visibleHeight/aspect/2;
      orthographicCamera.bottom = -visibleHeight/aspect/2;
      orthographicCamera.left = -visibleHeight/2;
      orthographicCamera.right = visibleHeight/2;
    } else {
      orthographicCamera.left = -visibleHeight*aspect/2;
      orthographicCamera.right = visibleHeight*aspect/2;
      orthographicCamera.top = visibleHeight/2;
      orthographicCamera.bottom = -visibleHeight/2;
    }
    orthographicCamera.zoom = 1;
    orthographicCamera.updateProjectionMatrix();

    camera = orthographicCamera;
    cube.material.uniforms.perspective.value = false;
  }

  controls.object = camera;
  controls.target.copy(target);
  controls.update();
  needsRender = true;
});

// Julia Mode

const setJuliaUniform = (i,v) => {
  cube.material.uniforms.iJ.value.setComponent(i,v);
  needsRender = true;
}

export { renderer, cameraResize, getMul, getMulTable, updateShader, setJuliaUniform };
