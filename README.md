# Model Image

## Description

Generation of static or dynamic svg images from json descriptions and typescript code.

- `/module/model-image` contains a typescript module that can be used in other javascript projects.
- '/processor' contains a standalone node.js program to process json files into svg.
- A powershell script to process json files

## Installation

### Module

Go into `/module/model-image` and run

``` sh
npm install
npm run build
```

To make the module locally available to other projects, run

``` sh
npm link
```

### Standalone processor

Ensure that the `model-image` module has been built and linked. Go into `/processor`

Run the following commands.

``` sh
npm install
npm link model-image
npm run build
```

## Usage

### Module

- module to integrate in other programs
  - node.js or browser
  - implement functions to create  DOMParser (from jsdom or native)
- command line, create svg
- development, watch source file and update svg
- parametric viewer 2D/3D

### Standalone

### Powershell script


## Author

Marc Geilen, <m.c.w.geilen@tue.nl>

## License

MIT License
