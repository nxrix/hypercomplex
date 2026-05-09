const shader = `
varying vec3 vP;
varying vec3 vW;
varying vec3 vN;
varying mat4 vM;

uniform bool perspective;

#define max_iter 16
#define eps 0.001
#define PI  3.1415926
#define TAU 6.2831853

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

//--input--//

#ifdef neps
#else
#define neps 0.0001
#endif

//#define accurate_f
#define accurate_n

#ifdef custom_f
#else
  #ifdef accurate_f
    float f(vec3 p) {
      vec4 c = s(vec4(p,0));
      vec4 z = vec4(0);
      vec4 dx = s(vec4(1,0,0,0)); 
      vec4 dy = s(vec4(0,1,0,0));
      vec4 dz = s(vec4(0,0,1,0));
      for (int i=0;i<max_iter;i++) {
        if (dot(z,z)>16.0) break;
        //--derivative--//
        z = //--power--//+c;
      }
      float zl = length(z);
      return 0.5*zl*log(zl)/sqrt(dot(dx,dx)+dot(dy,dy)+dot(dz,dz));
    }
  #else
    float f(vec3 p) {
      vec4 c = s(vec4(p,0));
      vec4 z = vec4(0);
      float d = 1.0;
      for (int i=0;i<max_iter;i++) {
        float r2 = dot(z,z);
        if (r2>16.0) break;
        vec4 z2 = //--power--//;
        z = z2+c;
        d = //--power_number--//*sqrt(dot(z2,z2)/max(r2,0.0001))*d+1.0;
      }
      float zl = length(z);
      return 0.5*zl*log(zl)/d;
    }
  #endif
#endif

#ifdef custom_n
#else
  #ifdef accurate_n
    vec3 n(vec3 p) {
      vec4 c = s(vec4(p,0));
      vec4 z = vec4(0);
      vec4 dx = s(vec4(1,0,0,0)); 
      vec4 dy = s(vec4(0,1,0,0));
      vec4 dz = s(vec4(0,0,1,0));
      for (int i=0;i<max_iter;i++) {
        float r2 = dot(z,z);
        if (r2>16.0) break;
        //--derivative--//
        z = //--power--//+c;
      }
      return normalize(vec3(
        dot(z,dx),
        dot(z,dy),
        dot(z,dz)
      ));
    }
  #else
    vec3 n(vec3 p) {
      const vec2 k = vec2(1,-1)*neps;
      return normalize(
        k.xyy*f(p+k.xyy)+
        k.yyx*f(p+k.yyx)+
        k.yxy*f(p+k.yxy)+
        k.xxx*f(p+k.xxx)
      );
    }
  #endif
#endif

vec4 render() {
  vec3 ro = cameraPosition;
  vec3 rd;
  if (perspective) {
    rd = normalize(vW-ro);
  } else {
    ro = vW;
    rd = normalize(vec3(vM[0][2],vM[1][2],vM[2][2]));
  }
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

void main() {
  gl_FragColor = render();
}`;

export { shader };
