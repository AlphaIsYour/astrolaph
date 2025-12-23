<script>
  import { onMount } from 'svelte';


  let nekoPosX = 32;
  let nekoPosY = 32;
  let backgroundPosition = "-96px -96px"; 
  
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const nekoSpeed = 10;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (idleTime > 10 && Math.random() < 0.005 && idleAnimation == null) {
      let availableIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) availableIdleAnimations.push("scratchWallW");
      if (nekoPosY < 32) availableIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) availableIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) availableIdleAnimations.push("scratchWallS");
      idleAnimation = availableIdleAnimations[Math.floor(Math.random() * availableIdleAnimations.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) setSprite("tired", 0);
        else setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case "scratchWallN": case "scratchWallS": case "scratchWallE": case "scratchWallW": case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    resetIdleAnimation();

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7) - 1;
      return;
    }

    let direction = "";
    if (diffY / distance > 0.5) direction = "N";
    else if (diffY / distance < -0.5) direction = "S";
    if (diffX / distance > 0.5) direction += "W";
    else if (diffX / distance < -0.5) direction += "E";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;
    
    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);
  }

  onMount(() => {
    const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
    if (isReducedMotion) return;

    const handleMouseMove = (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);

    let lastFrameTimestamp;
    let animationFrameId;
    function onAnimationFrame(timestamp) {
      if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
      
      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp;
        frame();
      }
      animationFrameId = window.requestAnimationFrame(onAnimationFrame);
    }
    animationFrameId = window.requestAnimationFrame(onAnimationFrame);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.cancelAnimationFrame(animationFrameId);
    };
  });
</script>

<div 
  class="oneko-neko"
  style="left: {nekoPosX - 16}px; top: {nekoPosY - 16}px; background-position: {backgroundPosition};"
  aria-hidden="true"
>
</div>

<style>
  .oneko-neko {
    width: 32px;
    height: 32px;
    position: fixed;
    pointer-events: none;
    image-rendering: pixelated;
    z-index: 2147483647;
    background-image: url('/neko.gif');
  }
</style>