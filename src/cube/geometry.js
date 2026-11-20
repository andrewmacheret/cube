import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Shape, ShapeGeometry, Vector3 } from 'three';

// A flat quad that isn't drawn. Used for picking with the mouse and as the parent that turns.
export function makeHitQuad(corners) {
  const vertexPositions = [corners[0], corners[1], corners[2], corners[3], corners[0], corners[2]];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertexPositions.flat()), 3));
  return new Mesh(geometry, new MeshBasicMaterial({ visible: false }));
}

// A rounded square sticker that fills the quad, minus `inset` on each side.
// corners go around the quad in the order that makes it face outward.
export function makeSticker(corners, { inset, radius }, material) {
  const origin = new Vector3(...corners[0]);
  const u = new Vector3(...corners[1]).sub(origin);
  const v = new Vector3(...corners[3]).sub(origin);
  const width = u.length();
  const height = v.length();
  u.normalize();
  v.normalize();

  const geometry = new ShapeGeometry(roundedRect(inset, inset, width - 2 * inset, height - 2 * inset, radius), 4);

  // move the flat 2D shape onto the face of the cube
  const position = geometry.attributes.position;
  const point = new Vector3();
  for (let i = 0; i < position.count; i++) {
    point.copy(origin).addScaledVector(u, position.getX(i)).addScaledVector(v, position.getY(i));
    position.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return new Mesh(geometry, material);
}

function roundedRect(x, y, width, height, radius) {
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}
