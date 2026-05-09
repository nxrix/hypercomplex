import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { tables } from "./tables.js";
import { shader } from "./shader.js";

const get_mul = (n,mat) => {
  const assignment = tables[n];
  const comps = ["x","y","z","w"];
  const roomSums = { 0: [], 1: [], 2: [], 3: [] };
  for (let i = 0; i < 16; i++) {
    const room = assignment[i];
    const aComp = comps[Math.floor(i / 4)];
    const bComp = comps[i % 4];
    const term = `${mat[i]?"-":"+"}a.${aComp}*b.${bComp}`;
    roomSums[room].push(term);
  }
  let glsl = "vec4 mul(vec4 a, vec4 b) {\n";
  glsl += "  return vec4(\n";
  for (let r = 0; r < 4; r++) {
    const terms = roomSums[r];
    let sumStr;
    if (terms.length === 0) {
      sumStr = "0.0";
    } else if (terms.length === 1) {
      sumStr = terms[0];
    } else {
      sumStr = terms.join(" + ");
    }
    glsl += `    ${sumStr}`;
    if (r < 3) glsl += ",";
    glsl += "\n";
  }
  glsl += "  );\n";
  glsl += "}";
  return glsl;
}

const get_mul_table = (n,mat) => {
  const b = tables[n].map(i=>["1","i","j","k"][i]);
  const m = mat.map(i=>i?"-":" ");
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

const get_derivative = (n,d) => {
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

const get_shader = (n,m,o) => {
  const p = parseInt(pinput.value);
  return shader.replace("//--input--//",
    `#define s(p) p.${["xyzw","xywz","xwyz","wxyz"][o]}\n`+
    get_mul(n,m)
  ).replaceAll("//--derivative--//",
    `dx = ${get_derivative(p,"dx")}+s(vec4(1,0,0,0));\n`+
    `dy = ${get_derivative(p,"dy")}+s(vec4(0,1,0,0));\n`+
    `dz = ${get_derivative(p,"dz")}+s(vec4(0,0,1,0));`
  ).replaceAll("//--power--//",[...Array(p-1)].reduce((a,_)=>`mul(${a},z)`,"z")).replace("//--power_number--//",p+".0");
}

const renderer = new THREE.WebGLRenderer({ canvas, context: canvas.getContext("webgl2",{ antialias: false, preserveDrawingBuffer: true }) });
renderer.setSize(512,512,false);
renderer.setPixelRatio(1);
renderer.outputColorSpace  = THREE.LinearSRGBColorSpace;

const perspectiveCam = new THREE.PerspectiveCamera(45,1,0.125,256);
const orthoCam = new THREE.OrthographicCamera(-2,2,2,-2,0.125,256);
perspectiveCam.position.set(0,0,4);
orthoCam.position.set(0,0,4);
let camera = orthoCam;

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

const material = new THREE.ShaderMaterial({
  vertexShader: vs,
  uniforms: {
    perspective: { value: false }
  },
  side: THREE.DoubleSide
});
const geometry = new THREE.BoxGeometry(4,4,4);
const cube = new THREE.Mesh(geometry,material);
scene.add(cube);

const camera_resize = (w,h) => {
  renderer.setSize(w,h,false);
  
  const aspect = w/h;

  perspectiveCam.aspect = aspect;
  perspectiveCam.zoom = aspect<=1?aspect:1;
  perspectiveCam.updateProjectionMatrix();

  if (aspect<=1) {
    const visibleHeight = orthoCam.left - orthoCam.right;
    orthoCam.top = -visibleHeight/aspect/2;
    orthoCam.bottom = visibleHeight/aspect/2;
  } else {
    const visibleHeight = orthoCam.top - orthoCam.bottom;
    orthoCam.left = -visibleHeight*aspect/2;
    orthoCam.right = visibleHeight*aspect/2;
  }
  orthoCam.updateProjectionMatrix();

  renderer.render(scene,camera);
}
//window.addEventListener("resize",()=>camera_resize(window.innerWidth,window.innerHeight));
//camera_resize(window.innerWidth,window.innerHeight);

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

const update_shader = (n,m,o) => {
  cube.material.fragmentShader = get_shader(n,m,o);
  cube.material.needsUpdate = true;
  needsRender = true;
}

camera_fov.addEventListener("input",() => {
  perspectiveCam.fov = camera_fov.value;
  perspectiveCam.updateProjectionMatrix();
  needsRender = true;
});

camera_type.addEventListener("change", () => {
  const target = controls.target.clone();
  const position = camera.position.clone();

  const aspect = canvas.width / canvas.height;
  const halfFovRad = perspectiveCam.fov * Math.PI / 360;
  if (camera_type.checked) {
    const distance = position.distanceTo(target);
    const visibleHeight = 2 * distance * Math.tan(halfFovRad);

    orthoCam.position.copy(position);
    if (aspect<=1) {
      orthoCam.top = visibleHeight/aspect/2;
      orthoCam.bottom = -visibleHeight/aspect/2;
      orthoCam.left = -visibleHeight/2;
      orthoCam.right = visibleHeight/2;
    } else {
      orthoCam.left = -visibleHeight*aspect/2;
      orthoCam.right = visibleHeight*aspect/2;
      orthoCam.top = visibleHeight/2;
      orthoCam.bottom = -visibleHeight/2;
    }
    orthoCam.zoom = 1;
    orthoCam.updateProjectionMatrix();

    camera = orthoCam;
    cube.material.uniforms.perspective.value = false;
  } else {
    const visibleHeight = (aspect<=1?(orthoCam.right-orthoCam.left):(orthoCam.top-orthoCam.bottom))/orthoCam.zoom;
    const newDistance = visibleHeight / (2 * Math.tan(halfFovRad));
    const direction = new THREE.Vector3().subVectors(position,target).normalize();
    const newPosition = target.clone().add(direction.multiplyScalar(newDistance));
    perspectiveCam.position.copy(newPosition);
    perspectiveCam.updateProjectionMatrix();

    camera = perspectiveCam;
    cube.material.uniforms.perspective.value = true;
  }

  controls.object = camera;
  controls.target.copy(target);
  controls.update();
  needsRender = true;
});

export { renderer, camera_resize, get_mul, get_mul_table, update_shader };
