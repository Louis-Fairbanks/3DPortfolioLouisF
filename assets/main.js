const slidingListItems = document.getElementsByClassName('sliding-list-item');
const tagline = document.querySelector('#tagline');
const slidingListArray = Array.from(slidingListItems);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    slidingListArray.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('shown');
      }, index * 400); // Delay each item by 300 milliseconds multiplied by its index
    });
    tagline.classList.add('shown');
  }, 2000);
});

let scene, camera, renderer, controls, rollObject, group;
const rollObjects = [];

const rotateConditions = {
  right: { axis: "x", value: 1 },
  left: { axis: "x", value: -1 },
  top: { axis: "y", value: 1 },
  bottom: { axis: "y", value: -1 },
  front: { axis: "z", value: 1 },
  back: { axis: "z", value: -1 }
};

const step = Math.PI / 100;
const faces = ["front", "back", "left", "right", "top", "bottom"];
const directions = [-1, 1];
const cPositions = [-1, 0, 1];
let cubes = [];

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform vec3 faceColor;

void main() {
    vec3 border = vec3(0.533);
    float bl = smoothstep(0.0, 0.03, vUv.x);
    float br = smoothstep(1.0, 0.97, vUv.x);
    float bt = smoothstep(0.0, 0.03, vUv.y);
    float bb = smoothstep(1.0, 0.97, vUv.y);
    vec3 c = mix(border, faceColor, bt*br*bb*bl);
    gl_FragColor = vec4(c, 1.0);
}
`;
const createMaterial = (color) =>
  new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    uniforms: { faceColor: { type: "v3", value: color } }
  });

const materials = Object.entries({
  gray: new THREE.Vector4(0.301, 0.243, 0.243)
}).reduce((acc, [key, val]) => ({ ...acc, [key]: createMaterial(val) }), {});

function init() {
  const { innerHeight, innerWidth } = window;
  scene = new THREE.Scene();
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(innerWidth / 4, innerHeight / 4);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
  camera.position.set(4, 4, 4);
  controls = new THREE.OrbitControls(camera, canvas);
  createObjects();
}

class Roll {
  constructor(face, direction) {
    this.face = face;
    this.stepCount = 0;
    this.active = true;
    this.init();
    this.direction = direction;
    this.step = Math.PI / 50; // Increase the rotation step
    this.maxStepCount = 25; // Decrease the step count
  }

  init() {
    cubes.forEach((item) => {
      if (item.position[this.face.axis] == this.face.value) {
        scene.remove(item);
        group.add(item);
      }
    });
  }
  rollFace() {
    if (this.stepCount != this.maxStepCount) {
      group.rotation[this.face.axis] += this.direction * this.step;
      this.stepCount += 1;
    } else {
      if (this.active) {
        this.active = false;
        this.clearGroup();
      }
    }
  }

  clearGroup() {
    for (var i = group.children.length - 1; i >= 0; i--) {
      let item = group.children[i];
      item.getWorldPosition(item.position);
      item.getWorldQuaternion(item.rotation);
      item.position.x = Math.round(item.position.x);
      item.position.y = Math.round(item.position.y);
      item.position.z = Math.round(item.position.z);
      group.remove(item);
      scene.add(item);
    }
    group.rotation[this.face.axis] = 0;
  }
}

async function loadTexture(path) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      path,
      texture => resolve(texture), // On load, resolve the Promise
      undefined,
      error => reject(error) // On error, reject the Promise
    );
  });
}

async function createObjects() {
  const geometry = new THREE.BoxGeometry(1, 1, 1); //make a 1x1x1 cube

  const cubeImages = [
    await loadTexture('/assets/images/logo pieces.jpg'),
    await loadTexture('/assets/images/logo pieces2.jpg'), 
    await loadTexture('/assets/images/logo pieces3.jpg'), 
    await loadTexture('/assets/images/logo pieces4.jpg'), 
    await loadTexture('/assets/images/logo pieces5.jpg'), 
    await loadTexture('/assets/images/logo pieces6.jpg'),
    await loadTexture('/assets/images/logo pieces7.jpg'),
    await loadTexture('/assets/images/logo pieces8.jpg'), 
    await loadTexture('/assets/images/logo pieces9.png')
  ];

  const createCube = async (position) => {
    let mat = [];
  
    for (let i = 0; i < 6; i++) {
      let textureIndex;

      if(position.x == 0 && position.y == 0 && position.z == 0) {//middlemost cube
        mat[i] = materials.gray;
      }
      else if(position.x == 0 && position.y == 0 && position.z == 1) { //front-center cube
        switch(i) {
          case 0: case 1:
          case 2: case 3: mat[i] = materials.gray; break;
          case 4: textureIndex= 4; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 0 && position.y == 0 && position.z == -1) { //back-center cube
        switch(i) {
          case 0: case 1: case 2: case 3: case 4:  mat[i] = materials.gray; break;
          case 5: textureIndex = 4; break;
        }
      }
      else if(position.x == 0 && position.y == 1 && position.z == 0) { //top-center cube
        switch(i) {
          case 0:
          case 1: mat[i] = materials.gray; break;
          case 2: textureIndex = 4; break;
          case 3: case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 0 && position.y == -1 && position.z == 0) { //bottom-center cube
        switch(i) {
          case 0:
          case 1: 
          case 2:mat[i] = materials.gray; break;
          case 3: textureIndex = 4; break; case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == 0 && position.z == 0) { //right-center cube
        switch(i) {
          case 0: textureIndex = 4; break;
          case 1:  case 2:
          case 3: case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == -1 && position.y == 0 && position.z == 0) { //left-center cube
        switch(i) {
          case 0: case 1:  textureIndex = 4; break; case 2: case 3: case 4: 
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == 1 && position.z == 0) { //top-right cube
        switch(i) {
          case 0: textureIndex = 1; break;
          case 1: mat[i] = materials.gray; break; case 2: mat[i] =  textureIndex = 5; break;
           case 3: case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == -1 && position.z == 0) { //bottom-right cube
         switch(i){
          case 0: textureIndex = 8; break; case 1: case 2:
            mat[i] = materials.gray; break;
             case 3: textureIndex = 5; break; case 4:
          case 5:  mat[i] = materials.gray; break;
         }
      }
      else if(position.x == -1 && position.y == 1 && position.z == 0) { //top-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break; case 1: textureIndex = 1; break;
           case 2: textureIndex = 3; break;
          case 3: case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == -1 && position.y == -1 && position.z == 0) { //bottom-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break; case 1: textureIndex = 8; break;
          case 2: textureIndex = 3; break;
         case 3: textureIndex = 3; break;
          case 4: case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == 0 && position.z == 1) { //front-right cube
        switch(i){
          case 0: textureIndex = 3; break;
          case 1:
          case 2: 
          case 3: mat[i] = materials.gray; break; 
          case 4: textureIndex = 5; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == 0 && position.z == -1) { //back-right cube
        switch(i){
          case 0: textureIndex = 5; break;
          case 1:
          case 2: 
          case 3:  
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 3; break;
        }
      }
      else if(position.x == -1 && position.y == 0 && position.z == 1) { //front-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1:textureIndex = 5; break;
          case 2: 
          case 3:  mat[i] = materials.gray; break;
          case 4: textureIndex = 3; break;
          case 5:mat[i] = materials.gray; break;
        }
      }
      else if(position.x == -1 && position.y == 0 && position.z == -1) { //back-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1:textureIndex = 3; break;
          case 2: 
          case 3:  
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 5; break;
        }
      }
      else if(position.x == 0 && position.y == 1 && position.z == 1) { //front-top cube
        switch(i){
          case 0:
          case 1: mat[i] = materials.gray; break;
          case 2: textureIndex = 8; break;
          case 3: mat[i] = materials.gray; break;
          case 4: textureIndex = 1; break;
          case 5: mat[i] = materials.gray; break; 
        }
      }
      else if(position.x == 0 && position.y == 1 && position.z == -1) { //back-top cube
        switch(i){
          case 0:
          case 1: mat[i] = materials.gray; break;
          case 2: textureIndex = 1; break;
          case 3: 
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 1; break; 
        }
      }
      else if(position.x == 0 && position.y == -1 && position.z == 1) { //front-bottom cube
        switch(i){
          case 0:
          case 1:
          case 2:  mat[i] = materials.gray; break; 
          case 3: textureIndex = 1; break;
          case 4: textureIndex = 8; break;
          case 5: mat[i] = materials.gray; break; 
        }
      }
      else if(position.x == 0 && position.y == -1 && position.z == -1) { //back-bottom cube
        switch(i){
          case 0:
          case 1: 
          case 2: mat[i] = materials.gray; break;
          case 3: textureIndex = 8; break;
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 8; break; 
        }
      }
      else if(position.x == 1 && position.y == 1 && position.z == 1) { //front-top-right cube
        switch(i){
          case 0: textureIndex = 0; break;
          case 1: mat[i] = materials.gray; break;
          case 2: textureIndex = 7; break;
          case 3: mat[i] = materials.gray; break;
          case 4: textureIndex= 2; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == 1 && position.z == -1) { //back-top-right cube
        switch(i){
          case 0: textureIndex = 2; break;
          case 1: mat[i] = materials.gray; break;
          case 2: textureIndex = 2; break;
          case 3:
          case 4:  mat[i] = materials.gray; break;
          case 5: textureIndex = 0; break;
        }
      }
      else if(position.x == 1 && position.y == -1 && position.z == 1) { //front-bottom-right cube
        switch(i){
          case 0: textureIndex = 6; break;
          case 1: 
          case 2: mat[i] = materials.gray; break;
          case 3: textureIndex = 2; break;
          case 4: textureIndex = 7; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == 1 && position.y == -1 && position.z == -1) { //back-bottom-right cube
        switch(i){
          case 0: textureIndex = 7; break;
          case 1: 
          case 2: mat[i] = materials.gray; break;
          case 3: textureIndex = 7; break;
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 6; break;
        }
      }
      else if(position.x == -1 && position.y == 1 && position.z == 1) { //front-top-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1: textureIndex = 2; break;
          case 2: textureIndex = 6; break;
          case 3: mat[i] = materials.gray; break;
          case 4: textureIndex = 0; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == -1 && position.y == 1 && position.z == -1) { //back-top-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1: 
          case 2: textureIndex = 0; break;
          case 3: 
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 2; break;
        }
      }
      else if(position.x == -1 && position.y == -1 && position.z == 1) { //front-bottom-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1: textureIndex = 7; break;
          case 2: mat[i] = materials.gray; break;
          case 3: textureIndex = 0; break;
          case 4: textureIndex = 6; break;
          case 5: mat[i] = materials.gray; break;
        }
      }
      else if(position.x == -1 && position.y == -1 && position.z == -1) { //back-bottom-left cube
        switch(i){
          case 0: mat[i] = materials.gray; break;
          case 1: textureIndex = 6; break;
          case 2: mat[i] = materials.gray; break;
          case 3: textureIndex = 6; break;
          case 4: mat[i] = materials.gray; break;
          case 5: textureIndex = 7; break;
        }
      }
      // Apply the image to this face
      if(mat[i] != materials.gray){
      const texture = cubeImages[textureIndex].clone();
      texture.needsUpdate = true;
      mat[i] = new THREE.MeshBasicMaterial({ map: texture });}
    }
  
    const cube = new THREE.Mesh(geometry, mat);
    cube.position.set(position.x, position.y, position.z); // Adjust position to center the cube
    cubes.push(cube);
    scene.add(cube);
  };

    cPositions.forEach((x) => {
      cPositions.forEach((y) => {
        cPositions.forEach((z) => {
          createCube({ x, y, z });
        });
      });
    });
  group = new THREE.Group();
  scene.add(group);
  renderer.domElement.style.opacity = 0;
  rollObject = new Roll(rotateConditions["top"], -1);
  rollObjects.push(rollObject);
}

let reversing = false; // Variable to keep track of whether we're reversing the rolls

function update() {
  if (rollObject) {
    if (rollObject.active) {
      rollObject.rollFace();
    } else {
      if (reversing) {
        renderer.domElement.style.opacity = 1; // Make the scene visible
        if (rollObjects.length > 0) {
          let lastRoll = rollObjects.pop(); // Get the last roll
          // Create a new Roll object with the opposite direction
          rollObject = new Roll(lastRoll.face, -lastRoll.direction);
        } else {
          reversing = false; // If there are no more rolls to reverse, stop reversing
          rollObject = null; // Stop the animation
        }
      } else {
        renderer.domElement.style.opacity = 0; // Make the scene invisible
        if (rollObjects.length >= 14) {
          reversing = true; // If we've performed 10 rolls, start reversing
        } else {
          let face;
          do {
            face = rotateConditions[faces[Math.floor(Math.random() * faces.length)]];
          } while (rollObjects.length > 0 && rollObjects[rollObjects.length - 1].face === face);
          rollObject = new Roll(
            face,
            directions[Math.floor(Math.random() * directions.length)]
          );
          rollObjects.push(rollObject);
        }
      }
    }
  }
}

function render() {
  requestAnimationFrame(render);
  update();
  renderer.render(scene, camera);
}

init();
render();