# Project Choros Engine

3D engine written in typescript with WebGL 2.0

<table>
  <tr>
    <td> <img src="/public/res/img/terrain.jpg"  alt="terrain" width = 640px height = 250px ></td>
    <td><img src="/public/res/img/phong.JPG" alt="phong" width = 640px height = 250px></td>
  </tr> 
</table>

Please notice that the engine is currently intended for educational use only (see 'goals and philosophy' section for more information).

## Features

- Entity based scene graph
- Extendable components

- Frustrum culling (bounding sphere and box)
- Indexed and skinned geometry rendering
- Single light lambert and phong shading

- Terrain component with vertex heightmap displacement
- Discrete terrain chunk partitioning

- Integrated debug console and commands (shortcut: ^)
- WebRTC networking for scene state synch between clients (see scene-server repo)
- Basic gltf parser for geometry, joints and animations

## Goals and Philosophy

Goals of this engine are to learn and explore graphic and networking development
with a focus on an API in favor of usability and readability similar to Unity
instead of a highly optimized but cryptic code base as seen in some 
data oriented approches (which might not be as revelvant for the web
due to different java script engine implementations)

## Getting Started

### Installing

```
npm install
```

### Executing program

```
npm run dev
```

## Dependencies

gl-matrix
short-uuid

## Authors

ex. Eric Jansen

## License

This project is licensed under the MIT License - see the LICENSE.md file for details