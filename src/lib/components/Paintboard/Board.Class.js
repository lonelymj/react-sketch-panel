import { fabric } from 'fabric-all-modules';
import { getCursor } from './cursors';

export const modes = {
  PENCIL: 'PENCIL',
  ERASERDRAW: 'ERASERDRAW',
  MOVE: 'MOVE'
};

export class Board {
  canvas;
  modes;
  cursorPencil = getCursor('pencil');
  mouseDown = false;
  mouseRightDown = false;
  drawInstance = null;
  drawingSettings;
  canvasConfig = {
    zoom: 1,
    contentJSON: null,
    minZoom: 0.05,
    maxZoom: 9.99,
    viewportTransform: [1, 0, 0, 1, 0, 0],
  };

  constructor(params) {
    if (params) {
      this.drawingSettings = params.drawingSettings;
    }
    this.canvas = this.initCanvas(this.canvasConfig);

    this.canvas.once('after:render', () => {
      this.applyCanvasConfig(params.canvasConfig);
    });

    this.modes = modes;
    this.resetZoom();
    this.setDrawingMode(this.drawingSettings.currentMode);
    this.addZoomListeners();
  }

  initCanvas() {
    fabric.Canvas.prototype.getItemByAttr = function (attr, name) {
      var object = null,
        objects = this.getObjects();
      for (var i = 0, len = this.size(); i < len; i++) {
        if (objects[i][attr] && objects[i][attr] === name) {
          object = objects[i];
          break;
        }
      }
      return object;
    };

    const canvasElement = document.getElementById('canvas');
    if (!canvasElement) return;

    const parentElement = canvasElement.parentNode;

    const canvas = new fabric.Canvas('canvas',{
      fireRightClick: true, // 启用右键，button的数字为3
      stopContextMenu: true, // 禁止默认右键菜单
    });
    canvas.perPixelTargetFind = true;

    if (parentElement) {
      const that = this;
      this.element = this.handleResize(this.resizeCanvas(canvas, parentElement).bind(this));
      this.element.observe(parentElement);
    }

    return canvas;
  }

  applyCanvasConfig(canvasConfig) {
    this.canvasConfig = { ...this.canvasConfig, ...canvasConfig };
    if (this.canvasConfig.zoom) {
      this.canvas.setZoom(this.canvasConfig.zoom);
    }
    if (this.canvasConfig.contentJSON) {
      this.canvas.loadFromJSON(this.canvasConfig.contentJSON);
    }
    if (this.canvasConfig.viewportTransform) {
      this.canvas.viewportTransform = this.canvasConfig.viewportTransform;
      this.changeZoom({ scale: 1 });
    }
    this.canvas.requestRenderAll();
    // console.log(this.canvas.getObjects());
    this.canvas.fire('config:change');
  }

  addZoomListeners() {
    const canvas = this.canvas;
    const that = this;
    canvas.off('mouse:wheel');
    canvas.off('touch:gesture');

    canvas.on('mouse:wheel', function (opt) {
      opt.e.preventDefault();
      opt.e.stopPropagation();
      if (opt.e.shiftKey) {
        const delta = opt.e.deltaY;
        const scale = 0.995 ** delta;
        const point = { x: opt.e.offsetX, y: opt.e.offsetY };
        that.changeZoom({ point, scale });
      } else if (opt.e.ctrlKey){
        const currWidth = that.drawingSettings.brushWidth;
        let delta = 1;
        if(opt.e.deltaY>0){
          delta = -1;
        }
        let scale = currWidth + delta;
        if(0< scale && scale<=30){
          canvas.fire('brush:change', {target:{value:scale}, currentMode:that.drawingSettings.currentMode});
        }
      } else {
        // const e = opt.e;
        // let vpt = canvas.viewportTransform;
        // vpt[4] -= e.deltaX;
        // vpt[5] -= e.deltaY;

        // const boundaries = that.getCanvasContentBoundaries();

        // let scrolledX = vpt[4] + e.deltaX;
        // let scrolledY = vpt[5] + e.deltaY;
        // console.log('scrolled', scrolledX, scrolledY);
        // console.log('boundaries', boundaries);

        // const offset = 50;

        // scrolledX =
        //   scrolledX < -boundaries.maxX + offset
        //     ? -boundaries.maxX + offset
        //     : -scrolledX < boundaries.minX - canvas.width + offset
        //     ? canvas.width - boundaries.minX - offset
        //     : scrolledX;
        // scrolledY =
        //   scrolledY < -boundaries.maxY + offset
        //     ? -boundaries.maxY + offset
        //     : -scrolledY < boundaries.minY - canvas.height + offset
        //     ? canvas.height - boundaries.minY - offset
        //     : scrolledY;

        // that.throttle(() => console.log('after', scrolledX, scrolledY));

        // vpt[4] = scrolledX;
        // vpt[5] = scrolledY;

        // console.log(vpt);

        // canvas.requestRenderAll();
      }
    });

    canvas.on('touch:gesture', (event) => {
      // console.log('1 touch:gesture');
      if (event.e.touches && event.e.touches.length === 2) {
        const point1 = {
          x: event.e.touches[0].clientX,
          y: event.e.touches[0].clientY,
        };
        const point2 = {
          x: event.e.touches[1].clientX,
          y: event.e.touches[1].clientY,
        };

        const prevDistance = canvas.getPointerDistance(point1, point2);

        canvas.on('touch:gesture', (event) => {
          // console.log('2 touch:gesture');
          const newDistance = canvas.getPointerDistance(point1, point2);
          const zoom = newDistance / prevDistance;

          const point = {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2,
          };

          const scale = zoom;

          that.changeZoom({ point, scale });
          canvas.renderAll();

          prevDistance = newDistance;
        });
      }
    });
    
  }

  setDrawingSettings(drawingSettings) {
    if (!drawingSettings) return;

    this.drawingSettings = { ...this.drawingSettings, ...drawingSettings };
    this.setDrawingMode(this.drawingSettings.currentMode);
  }

  setCanvasConfig(canvasConfig) {
    if (!canvasConfig) return;

    this.applyCanvasConfig(canvasConfig);
  }

  setDrawingMode(mode) {
    this.drawingSettings.currentMode = mode;
    this.resetCanvas();

    switch (mode) {
      case this.modes.PENCIL:
        this.draw();
        break;
      case this.modes.LINE:
        this.createLine();
        break;
      case this.modes.RECTANGLE:
        this.createRect();
        break;
      case this.modes.ELLIPSE:
        this.createEllipse();
        break;
      case this.modes.TRIANGLE:
        this.createTriangle();
        break;
      case this.modes.ERASER:
        this.eraserOn();
        break;
      case this.modes.ERASERDRAW:
        this.eraserDrawOn();
        break;
      case this.modes.SELECT:
        this.onSelectMode();
        break;
      case this.modes.MOVE:
        this.onMoveMode();
        break;
      case this.modes.TEXT:
        this.createText();
        break;
      default:
        this.draw();
    }
  }

  resetCanvas() {
    const canvas = this.canvas;

    this.removeCanvasListener(canvas);
    canvas.selection = false;
    canvas.isDrawingMode = false;
    canvas.defaultCursor = 'auto';
    canvas.hoverCursor = 'auto';
    canvas.getObjects().map((item) => item.set({ selectable: false }));

    if (this.editedTextObject) {
      this.editedTextObject.exitEditing();
      this.editedTextObject = null;
    }
  }

  throttle(f, delay = 300) {
    let timer = 0;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => f.apply(this, args), delay);
    };
  }

  handleResize(callback) {
    const resize_ob = new ResizeObserver(this.throttle(callback, 300));
    return resize_ob;
  }

  resizeCanvas(canvas, whiteboard) {
    return function () {
      const width = whiteboard.clientWidth - 110;
      const height = whiteboard.clientHeight - 110;
      this.changeZoom({ scale: 1 });
      // const scale = width / canvas.getWidth();
      // const zoom = canvas.getZoom() * scale;
      canvas.setDimensions({ width: width, height: height });
      // canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    };
  }

  removeCanvasListener() {
    const canvas = this.canvas;
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('mouse:over');
  }

  draw() {
    const canvas = this.canvas;
    const drawingSettings = this.drawingSettings;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = drawingSettings.brushWidth;
    canvas.freeDrawingBrush.color = drawingSettings.currentColor;
    canvas.isDrawingMode = true;
    canvas.freeDrawingCursor = this.cursorPencil;
  }

  eraserDrawOn() {
    const canvas = this.canvas;
    const drawingSettings = this.drawingSettings;
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = drawingSettings.brushWidth;
    canvas.freeDrawingBrush.color = drawingSettings.currentColor;
    canvas.isDrawingMode = true;
    canvas.freeDrawingCursor = getCursor('eraser');
    
    canvas.defaultCursor = getCursor('eraser');
    // canvas.hoverCursor = getCursor('eraser');
  }
  
  onMoveMode() {
    const canvas = this.canvas;
    canvas.isDrawingMode = false;
    const drawingSettings = this.drawingSettings;
    canvas.on('mouse:down', function (opt) {
      var evt = opt.e;
      // if (evt.altKey === true) {
        this.isDragging = true
        this.lastPosX = evt.clientX
        this.lastPosY = evt.clientY
        
        canvas.defaultCursor = 'all-scroll';
        canvas.hoverCursor = 'all-scroll';
      // }
    });
  
    // 移动鼠标事件
    canvas.on('mouse:move', function (opt) {
      if (this.isDragging) {
        var e = opt.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX
        vpt[5] += e.clientY - this.lastPosY
        this.requestRenderAll()
        this.lastPosX = e.clientX
        this.lastPosY = e.clientY
      }
    });
  
    // 松开鼠标事件
    canvas.on('mouse:up', function (opt) {
      this.setViewportTransform(this.viewportTransform)
      this.isDragging = false
      
      canvas.defaultCursor = 'auto';
      canvas.hoverCursor = 'all-scroll';
    });
  }

  clearCanvas() {
    const canvas = this.canvas;
    canvas.getObjects().forEach(function (item) {
      if (item !== canvas.backgroundImage) {
        canvas.remove(item);
      }
    });
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
  }

  changeZoom({ point, scale }) {
    if (!point) {
      const width = this.canvas.width;
      const height = this.canvas.height;
      point = { x: width / 2, y: height / 2 };
    }

    const minZoom = this.canvasConfig.minZoom;
    const maxZoom = this.canvasConfig.maxZoom;

    scale = this.canvas.getZoom() * scale;
    scale = scale < minZoom ? minZoom : scale > maxZoom ? maxZoom : scale;

    this.canvas.zoomToPoint(point, scale);
    this.onZoom({ point, scale });
  }

  resetZoom() {
    var vpt = this.canvas.viewportTransform;
    vpt[4] = 0;
    vpt[5] = 0;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const point = { x: width / 2, y: height / 2 };
    const scale = 1;
    this.canvas.zoomToPoint(point, scale);
    this.onZoom({ point, scale });
  }

  onZoom(params) {
    this.addZoomListeners();
    this.canvas.fire('zoom:change', params);
  }

  openPage(page) {
    const canvas = this.canvas;
    const center = canvas.getCenter();

    fabric.Image.fromURL(page, (img) => {
      if (img.width > img.height) {
        img.scaleToWidth(canvas.width);
      } else {
        img.scaleToHeight(canvas.height - 100);
      }
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        top: center.top,
        left: center.left,
        originX: 'center',
        originY: 'center',
      });

      canvas.renderAll();
    });
  }

  getCanvasContentBoundaries() {
    const canvas = this.canvas;
    const objects = canvas.getObjects();

    // Initialize variables for min and max coordinates
    let minX = 10000;
    let minY = 10000;
    let maxX = -10000;
    let maxY = -10000;

    // Iterate through objects to find minimum and maximum coordinates
    objects.forEach((object) => {
      const objectBoundingBox = object.getBoundingRect();

      minX = Math.min(minX, objectBoundingBox.left);
      minY = Math.min(minY, objectBoundingBox.top);
      maxX = Math.max(maxX, objectBoundingBox.left + objectBoundingBox.width);
      maxY = Math.max(maxY, objectBoundingBox.top + objectBoundingBox.height);
    });

    // Calculate canvas size based on content
    const width = maxX - minX;
    const height = maxY - minY;
    return { minX, minY, maxX, maxY, width, height };
  }

  removeBoard() {
    this.element.disconnect();
    if (this.canvas) {
      this.canvas.off();
      this.canvas.dispose();
    }
    this.canvas = null;
  }

  // function drawBackground(canvas) {
  //   const dotSize = 4; // Adjust the size of the dots as needed
  //   const dotSvg = `
  //       <svg xmlns="http://www.w3.org/2000/svg" width="${dotSize * 10}" height="${
  //     dotSize * 10
  //   }" viewBox="0 0 ${dotSize * 10} ${dotSize * 10}">
  //         <circle cx="${dotSize / 2}" cy="${dotSize / 2}" r="${dotSize / 2}" fill="#00000010" />
  //       </svg>
  //     `;

  //   let rect;

  //   return new Promise((resolve) => {
  //     const dotImage = new Image();
  //     dotImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dotSvg);
  //     dotImage.onload = function () {
  //       const dotPattern = new fabric.Pattern({
  //         source: dotImage,
  //         repeat: 'repeat', // Adjust the repeat property to change the pattern repetition
  //       });

  //       const width = canvas.getWidth();
  //       const height = canvas.getHeight();

  //       const rect = new fabric.Rect({
  //         itemId: 'background-id-rectangle',
  //         width: width,
  //         height: height,
  //         fill: dotPattern,
  //         selectable: false, // Prevent the dot from being selected
  //         evented: false, // Prevent the dot from receiving events
  //         lockMovementX: true, // Prevent horizontal movement of the dot
  //         lockMovementY: true, // Prevent vertical movement of the dot
  //       });

  //       canvas.add(rect);
  //       resolve(rect);
  //     };
  //   });
  // }
}
