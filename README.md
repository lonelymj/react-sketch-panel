# react-sketch-panel

<div>
  <h2>
    fork from react-whiteboard-pdf
    add Paintboard component
    <br />
  </h2>
</div>

<br />

![Example](./app-example.png)

Check App demo here:

# App [DEMO](https://statuesque-muffin-fb224e.netlify.app/)

<br/>

<!-- ## If you like this project you can help us with $1,000,000 donation or any other amount

github: [github.com/sponsors/spiridonov-oa](https://github.com/sponsors/spiridonov-oa)
patreon: [patreon.com/OlegSpiridonov](https://patreon.com/OlegSpiridonov) -->

## Compatibility

React 17

<br/>

## Installation

```shell
npm install react-sketch-panel
```

or

```shell
yarn add react-sketch-panel
```

<br/>

## Usage

```javascript
const App = () => {
  return (
    <div>
      <Paintboard />
    </div>
  );
};
```

You can change default props

```javascript
import { Paintboard } from 'react-sketch-panel';

const sizes = ['512x512','800x600','600x800','1920x1080']

const App = () => {
  return (
    <Paintboard
      mode={'sketch'} // optional
      sizes={sizes} // :string[] if mode set to 'sketch', sizes prop must be passed 
      maxWidth={512}
      maxHeight={512}
      // default parameters
      drawingSettings={{
        brushWidth: 5, // :number (optional) (default: 5) - brush size for drawing
        background: false, // :boolean (optional) (default: false) - polkadot as background picture
        currentMode: modes.PENCIL, //
        currentColor: '#000000',
        brushWidth: 5,
        fill: false, // if true, square, rectangle, and triangle will be filled with current color
      }}
      // default controls
      controls={{
        PENCIL: true,
        MOVE: true,
        ERASERDRAW: true,
        CLEAR: true,
        FILL: true,
        BRUSH: true,
        COLOR_PICKER: true,
        DEFAULT_COLORS: true,
        FILES: true,
        SAVE_AS_IMAGE: true,
        SAVE_AS_IMAGE_WITHOUT_BACKGROUNDIMAGE: true,
        ZOOM: true,
      }}
      settings={{
        zoom: 1,
        minZoom: 0.05,
        maxZoom: 9.99,
        contentJSON: null, // JSON to render in canvas
      }}
      fileInfo={{
        file: { name: 'Desk 1' },
        totalPages: 1,
        currentPageNumber: 0,
        currentPage: '',
      }}
      onObjectAdded={(addedObject) => {}}
      onObjectRemoved={(removedObject) => {}}
      onObjectAdded={(data, event, canvas) => {}}
      onObjectRemoved={(data, event, canvas) => {}}
      onZoom={(data, event, canvas) => {}}
      onImageUploaded={(data, event, canvas) => {}}
      onPDFUploaded={(data, event, canvas) => {}}
      onPDFUpdated={(data, event, canvas) => {}}
      onPageChange={(data, event, canvas) => {}}
      onOptionsChange={(data, event, canvas) => {}}
      onSaveCanvasAsImage={(data, event, canvas) => {}}
      onConfigChange={(data, event, canvas) => {}}
      onSaveCanvasState={(data, event, canvas) => {}}
    />
  );
};
```

## Development:

```shell
npm i
npm start
```

## Author:

<!-- [spiridonov-oa](https://github.com/spiridonov-oa) -->

## Contributors:

<!-- Thanks for your help in building this project -->
<!-- [rodionspi](https://github.com/rodionspi) -->
