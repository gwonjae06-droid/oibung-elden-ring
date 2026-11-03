// Convert keyboard and touch input into the world-space direction of the camera.
export function cameraMovement(keys, stick, yaw, lock) {
  let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
    - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + stick.x;
  let z = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
    - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + stick.z;
  const magnitude = Math.max(1, Math.hypot(x, z));
  const sine = Math.sin(yaw), cosine = Math.cos(yaw);
  x /= magnitude;
  z /= magnitude;
  return {x: sine * z - cosine * x, z: cosine * z + sine * x, lock};
}
