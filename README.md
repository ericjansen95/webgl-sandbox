# WebGL Sandbox

**Vanllia WebGL engine written in typescript**

<table>
  <tr>
    <td> <img src="/public/res/img/overview.PNG"  alt="overview" width = 640px height = 250px ></td>
    <td><img src="/public/res/img/chunked-terrain.JPG" alt="terrain" width = 640px height = 250px></td>
  </tr> 
</table>

## Features

- Entity based scene graph
- Extendable components
- Frustrum culling (bounding sphere and box)
- Indexed and skinned geometry rendering
- Single directional light lambert and phong shading
- Terrain component with vertex heightmap displacement
- Discrete collision detection
- Discrete terrain chunk partitioning
- Flowmapped skydom
- Integrated debug console and commands (shortcut: ^)
- WebRTC networking for scene state synch between clients (see scene-server repo)
- Basic gltf parser for geometry, joints and animations

## Getting Started

#### Installing

`npm install`

#### Executing program

`npm run dev`

## Authors

ex. Eric Jansen

## Copyright

Copyright 2021 - 2024 Eric Jansen

## License

This project is licensed under the GNU GLP v3 license - see the LICENSE.md file for details.

## Dependencies

- gl-matrix
- short-uuid