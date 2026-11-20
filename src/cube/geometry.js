import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from 'three';

export function makeQuad(corners, color) {
  const vertexPositions = [corners[0], corners[1], corners[2], corners[3], corners[0], corners[2]];
  return makeShape(vertexPositions, color);
}

export function makeShape(vertexPositions, color) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertexPositions.flat()), 3));
  return new Mesh(geometry, new MeshBasicMaterial({ color }));
}
