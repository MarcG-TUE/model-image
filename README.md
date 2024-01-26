# Model Image

## Description

Generation of static or dynamic svg images from json descriptions and typescript code.

- `/module/model-image` contains a typescript module that can be used in other javascript projects.
- '/processor' contains a standalone node.js program to process json files into svg.
- A powershell script to process json files

## Installation

### Install Module

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

Module to integrate in other programs, node.js or browser based projects.

Usage requires to implement some plugin functions
to create  DOMParser (from jsdom in node.js or native in a browser)

Targets svg output or babylon.js 3D output.

#### Module Interface

To be described and to be reorganized.

### Standalone

- command line, create svg
- development, watch source file and update svg
- parametric viewer 2D/3D

### Powershell scripts

In `/scripts`, `model-image-convert.ps1` converts json file into svg.

`convert-to-pdf-chrome.ps1` converts SVG files to pdf files, for example for use in LaTeX.

Most accurate conversion from svg to pdf seems be by chromium-based browsers.



## Author

Marc Geilen, <m.c.w.geilen@tue.nl>

## License

MIT License
