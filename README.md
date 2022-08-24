# Project Choros Engine

**3D engine written in typescript with WebGL 2.0**

<table>
  <tr>
    <td> <img src="/public/res/img/terrain.jpg"  alt="terrain" width = 640px height = 250px ></td>
    <td><img src="/public/res/img/phong.JPG" alt="phong" width = 640px height = 250px></td>
  </tr> 
</table>

> Please notice that the engine is currently intended for educational use only (see 'goals and philosophy' section for more information).

## Features

- Entity based scene graph
- Extendable components

- Frustrum culling (bounding sphere and box)
- Indexed and skinned geometry rendering
- Single directional light lambert and phong shading

- Terrain component with vertex heightmap displacement
- Discrete terrain chunk partitioning

- Integrated debug console and commands (shortcut: ^)
- WebRTC networking for scene state synch between clients (see scene-server repo)
- Basic gltf parser for geometry, joints and animations

## Goals and Philosophy

Goals of this engine are to:

- learn and explore graphics and network development
- provide out of the box tools for engine insights to help optimization and debugging
- create a simple API with an focus on interation speed

## Getting Started

#### Installing

`npm install`

#### Executing program

`npm run dev`

## Authors

ex. Eric Jansen

## Copyright

Copyright 2021, 2022 Eric Jansen

## License

This project is licensed under the GNU GLP v3 license - see the LICENSE.md file for details.

## Dependencies

- gl-matrix
- short-uuid