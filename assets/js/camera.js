let camera = {x: 0, y: 0};
let camera_changing = false;

(()=>{
  let mousePos = {x: 0, y: 0};

  function getEventPos(e){
    if(e.touches && e.touches.length > 0){
      return {x: e.touches[0].clientX, y: e.touches[0].clientY};
    }
    return {x: e.clientX, y: e.clientY};
  }

  function startInteraction(e){
    camera_changing = true;
    const p = getEventPos(e);
    mousePos = p;
    e.preventDefault();
  }

  function moveInteraction(e){
    if(!camera_changing) return;
    const p = getEventPos(e);
    camera.x += (p.x - mousePos.x)/canvas.width;
    camera.y += (p.y - mousePos.y)/canvas.height;
    camera.y = Math.min(Math.max(camera.y,-0.2499999),0.2499999);
    mousePos = p;
    e.preventDefault();
  }

  function endInteraction(){
    camera_changing = false;
  }

  canvas.addEventListener("mousedown", startInteraction);
  canvas.addEventListener("mousemove", moveInteraction);
  canvas.addEventListener("mouseup", endInteraction);
  canvas.addEventListener("mouseleave", endInteraction);
  canvas.addEventListener("touchstart", startInteraction, {passive: false});
  canvas.addEventListener("touchmove", moveInteraction, {passive: false});
  canvas.addEventListener("touchend", endInteraction);
  canvas.addEventListener("touchcancel", endInteraction);

})();