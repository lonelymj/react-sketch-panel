import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PaintPanelS,
  ButtonS,
  ToolbarS,
  ZoomBarS,
  ColorBarS,
  ToolbarItemS,
  RangeInputS,
  ColorButtonS,
  SeparatorS,
  ToolbarHolderS,
  PDFWrapperS,
  DrawPanelS,
  SelectS,
  OptionS,
} from './Paintboard.styled';
import { fabric } from 'fabric-all-modules';
import { PdfReader } from '../PdfReader';
import { saveAs } from 'file-saver';
import { Board, modes } from './Board.Class.js';
import { ColorPicker } from '../ColorPicker';

import SelectIcon from './../images/cross.svg';
import EraserIcon from './../images/eraser.svg';
import TextIcon from './../images/text.svg';
import RectangleIcon from './../images/rectangle.svg';
import LineIcon from './../images/line.svg';
import EllipseIcon from './../images/ellipse.svg';
import TriangleIcon from './../images/triangle.svg';
import PencilIcon from './../images/pencil.svg';
import DeleteIcon from './../images/delete.svg';
import ZoomInIcon from './../images/zoom-in.svg';
import ZoomOutIcon from './../images/zoom-out.svg';
import DownloadIcon from './../images/download.svg';
import UploadIcon from './../images/add-photo.svg';
import FillIcon from './../images/color-fill.svg';

const initFileInfo = {
  file: { name: 'whiteboard' },
  totalPages: 1,
  currentPageNumber: 0,
  currentPage: '',
};

const initDrawingSettings = {
  brushWidth: 5,
  currentMode: 'PENCIL',
  currentColor: '#000000',
  brushWidth: 5,
  fill: false,
  // background: true,
};

const initSettings = {
  zoom: 1,
  contentJSON: null,
};

const Whiteboard = ({
  mode,
  maxWidth = 800,
  maxHeight = 800,
  sizes,
  controls,
  settings,
  drawingSettings,
  fileInfo,
  onObjectAdded = (data, event, canvas) => {},
  onObjectRemoved = (data, event, canvas) => {},
  onObjectModified = (data, event, canvas) => {},
  onCanvasRender = (data, event, canvas) => {},
  onCanvasChange = (data, event, canvas) => {},
  onZoom = (data, event, canvas) => {},
  onImageUploaded = (data, event, canvas) => {},
  onPDFUploaded = (data, event, canvas) => {},
  onPDFUpdated = (data, event, canvas) => {},
  onPageChange = (data, event, canvas) => {},
  onOptionsChange = (data, event, canvas) => {},
  onSaveCanvasAsImage = (data, event, canvas) => {},
  onConfigChange = (data, event, canvas) => {},
  onSaveCanvasState = (data, event, canvas) => {},
}) => {
  const [board, setBoard] = useState();
  const [canvasObjectsPerPage, setCanvasObjectsPerPage] = useState({});
  const [canvasDrawingSettings, setCanvasDrawingSettings] = useState({
    ...initDrawingSettings,
    ...drawingSettings,
  });
  const canvasConfig = { ...initSettings, ...settings };
  const [zoom, setZoom] = useState(canvasConfig.zoom);
  const [fileReaderInfo, setFileReaderInfo] = useState({ ...initFileInfo, ...fileInfo });
  const canvasRef = useRef(null);
  const whiteboardRef = useRef(null);
  const uploadPdfRef = useRef(null);
  const rangeInput = useRef(null);

  const enabledControls = useMemo(
    function () {
      return {
        [modes.PENCIL]: true,
        [modes.MOVE]: true,
        [modes.ERASERDRAW]: true,
        CLEAR: true,
        FILL: true,
        BRUSH: true,
        COLOR_PICKER: true,
        DEFAULT_COLORS: true,
        FILES: true,
        SAVE_AS_IMAGE: true,
        SAVE_AS_IMAGE_WITHOUT_BACKGROUNDIMAGE: true,
        ZOOM: true,

        ...controls,
      };
    },
    [controls],
  );

  useEffect(() => {
    setCanvasDrawingSettings({ ...canvasDrawingSettings, ...drawingSettings });
  }, [drawingSettings]);

  useEffect(() => {
    if (!board || !canvasConfig) return;
    board.setCanvasConfig(canvasConfig);
  }, [settings]);

  useEffect(() => {
    setFileReaderInfo({ ...fileReaderInfo, ...fileInfo });
  }, [fileInfo]);

  useEffect(() => {
    if (board) {
      return;
    }

    const newBoard = new Board({
      drawingSettings: canvasDrawingSettings,
      canvasConfig: canvasConfig,
    });

    setBoard(newBoard);
    addListeners(newBoard.canvas);

    return () => {
      if (board) {
        board.removeBoard();
      }
    };
  }, [board]);

  useEffect(() => {
    if (!board || !canvasDrawingSettings) return;

    board.setDrawingSettings(canvasDrawingSettings);
  }, [canvasDrawingSettings, board]);

  // useEffect(() => {
  //   if (!board || !canvasConfig) return;

  //   board.setCanvasConfig(canvasConfig);
  //   onConfigChange(canvasConfig, null, board.canvas);
  // }, [board, canvasConfig]);

  useEffect(() => {
    if (!board?.canvas || !fileReaderInfo.currentPage) {
      return;
    }

    const json = getPageJSON({
      fileName: fileReaderInfo.file.name,
      pageNumber: fileReaderInfo.currentPageNumber,
    });
    if (json) {
      board.canvas.loadFromJSON(json);
    } else {
      board.openPage(fileReaderInfo.currentPage);
    }
  }, [fileReaderInfo.currentPage]);

  function uploadImage(e) {
    const reader = new FileReader();
    const file = e.target.files[0];
    
    reader.addEventListener('load', () => {
      fabric.Image.fromURL(reader.result, (img) => {
        // img.scaleToHeight(board.canvas.height);
        // board.canvas.width=img.width;
        // board.canvas.height=img.height;
        
        // board.setCanvasConfig(state=>{return {...canvasConfig,...{width:img.width,height:img.height}}});

        // board.canvas.add(img);
        // board.setWidth(img.width);
        // board.setHeight(img.height);
        const imgWidth = img.width,imgHeight = img.height;
        let ratio = 1;
        if(imgWidth>imgHeight){
          ratio = maxWidth/imgWidth;
        }else{
          ratio = maxHeight/imgHeight;
        }
        board.canvas.setWidth(img.width*ratio);
        board.canvas.setHeight(img.height*ratio);
        img.scaleToHeight(img.height*ratio);
        board.canvas.setBackgroundImage(img, board.canvas.renderAll.bind(board.canvas));
        
        board.canvas.get("backgroundImage")?.set({ erasable: false });
      });
    });

    reader.readAsDataURL(file);
  }

  function addListeners(canvas) {
    canvas.on('after:render', (e) => {
      const data = getFullData(canvas);
      onCanvasRender(data, e, canvas);
    });

    canvas.on('zoom:change', function (data) {
      onZoom(data, null, canvas);
      setZoom(data.scale);
    });

    canvas.on('brush:change', function (data) {
      changeBrushWidth(data, canvas);
    });

    canvas.on('object:added', (event) => {
      onObjectAdded(event.target.toJSON(), event, canvas);
      onCanvasChange(event.target.toJSON(), event, canvas);
    });

    canvas.on('object:removed', (event) => {
      onObjectRemoved(event.target.toJSON(), event, canvas);
      onCanvasChange(event.target.toJSON(), event, canvas);
    });

    canvas.on('object:modified', (event) => {
      onObjectModified(event.target.toJSON(), event, canvas);
      onCanvasChange(event.target.toJSON(), event, canvas);
    });
  }

  function getFullData(canvas) {
    if (!canvas) return;

    return {
      settings: {
        contentJSON: canvas.toJSON(),
        viewportTransform: canvas.viewportTransform,
      },
      drawingSettings: canvasDrawingSettings,
      fileInfo: fileReaderInfo,
    };
  }

  function saveCanvasState() {
    const newValue = {
      ...canvasObjectsPerPage,
      [fileReaderInfo.file.name]: {
        ...canvasObjectsPerPage[fileReaderInfo.file.name],
        [fileReaderInfo.currentPageNumber]: board.canvas.toJSON(),
      },
    };
    setCanvasObjectsPerPage(newValue);
    onSaveCanvasState(newValue);
  }

  function changeBrushWidth(e,canvas) {
    const intValue = parseInt(e.target.value);
    const newOptions = { ...canvasDrawingSettings, brushWidth: intValue };
    setCanvasDrawingSettings(newOptions);
    
    if(canvas){
      canvas.freeDrawingBrush.width = intValue;
      onOptionsChange(newOptions, e, canvas);
    }else{
      board.canvas.freeDrawingBrush.width = intValue;
      onOptionsChange(newOptions, e, board.canvas);
    }
  }

  function changeMode(mode, e) {
    if (canvasDrawingSettings.currentMode === mode) return;
    const newOptions = { ...canvasDrawingSettings, currentMode: mode };
    setCanvasDrawingSettings(newOptions);
    onOptionsChange(newOptions, e, board.canvas);
  }

  function changeCurrentColor(color, e) {
    board.canvas.freeDrawingBrush.color = color;
    const newOptions = { ...canvasDrawingSettings, currentColor: color };
    setCanvasDrawingSettings(newOptions);
    onOptionsChange(newOptions, e, board.canvas);
  }

  function changeFill(e) {
    const newOptions = { ...canvasDrawingSettings, fill: !canvasDrawingSettings.fill };
    setCanvasDrawingSettings(newOptions);
    onOptionsChange(newOptions, e, board.canvas);
  }

  // 保存图片
  function handleSaveCanvasAsImage() {
    const backgroundImage = board.canvas.backgroundImage;
    board.resetZoom();
    board.canvas.setBackgroundImage(null);
    board.canvas.renderAll();

    canvasRef.current.toBlob(function (blob) {
      saveAs(blob, `${fileReaderInfo.file.name}${fileReaderInfo.currentPage ? '_page-' : ''}.png`);
      onSaveCanvasAsImage(blob, null, board.canvas);
    });
    board.canvas.setBackgroundImage(backgroundImage);
    board.canvas.renderAll();
  }

  

  // 保存图片
  function handleSaveCanvasAsImageWithBackgroundImage() {
    const backgroundImage = board.canvas.backgroundImage;
    board.resetZoom();

    canvasRef.current.toBlob(function (blob) {
      saveAs(blob, `${fileReaderInfo.file.name}${fileReaderInfo.currentPage ? '_page-' : ''}.png`);
      onSaveCanvasAsImage(blob, null, board.canvas);
    });
    board.canvas.setBackgroundImage(backgroundImage);
    board.canvas.renderAll();
  }

  function onFileChange(event) {
    if (!event.target.files[0]) return;
    if (event.target.files[0].type.includes('image/')) {
      uploadImage(event);
      onImageUploaded(event.target.files[0], event, board.canvas);
    } else if (event.target.files[0].type.includes('pdf')) {
      saveCanvasState();
      board.clearCanvas();
      updateFileReaderInfo({ file: event.target.files[0], currentPageNumber: 1 });
      onPDFUploaded(event.target.files[0], event, board.canvas);
    }
    event.target.value = '';
  }

  function sketchSizeChange(e){
    console.log(e.target.value);
    const values = e.target.value.split('x');
    const width = values[0], height = values[1];
    let ratio = 1;
    if(width>height){
      ratio = maxWidth / width;
    }else{
      ratio = maxHeight / height;
    }
    board.resetZoom();
    board.canvas.setWidth(width*ratio);
    board.canvas.setHeight(height*ratio);
    board.canvas.renderAll();
  }

  function getPageJSON({ fileName, pageNumber }) {
    if (canvasObjectsPerPage[fileName] && canvasObjectsPerPage[fileName][pageNumber]) {
      return canvasObjectsPerPage[fileName][pageNumber];
    } else {
      return null;
    }
  }

  function updateFileReaderInfo(data) {
    const newFileData = { ...fileReaderInfo, ...data };
    setFileReaderInfo(newFileData);
    onPDFUpdated(newFileData, null, board.canvas);
  }

  const handlePageChange = (page) => {
    saveCanvasState();
    board.clearCanvas(board.canvas);
    setFileReaderInfo({ ...fileReaderInfo, currentPageNumber: page });
    onPageChange({ ...fileReaderInfo, currentPageNumber: page }, null, board.canvas);
  };

  const handleZoomIn = () => {
    board.changeZoom({ scale: 1.1 });
  };

  const handleZoomOut = () => {
    board.changeZoom({ scale: 0.9 });
  };

  const handleResetZoom = () => {
    board.resetZoom(1);
  };

  const getColorButtons = (colors) => {
    return colors.map((color) => (
      <ToolbarItemS key={color}>
        <ColorButtonS color={color} onClick={(e) => changeCurrentColor(color, e)} />
      </ToolbarItemS>
    ));
  };

  const getControls = () => {
    const modeButtons = {
      [modes.PENCIL]: { icon: PencilIcon, name: 'Pencil' },
      [modes.MOVE]: { icon: SelectIcon, name: 'Move' },
      [modes.ERASERDRAW]: { icon: EraserIcon, name: 'EraserDraw' },
    };

    return Object.keys(modeButtons).map((buttonKey) => {
      if (!enabledControls[buttonKey]) return;
      const btn = modeButtons[buttonKey];
      return (
        <ButtonS
          key={buttonKey}
          type="button"
          className={`${canvasDrawingSettings.currentMode === buttonKey ? 'selected' : ''}`}
          onClick={(e) => changeMode(buttonKey, e)}
        >
          <img src={btn.icon} alt={btn.name} />
        </ButtonS>
      );
    });
  };

  return (
    // <div style={{height: '800px', width: '600px'}}>
    <PaintPanelS ref={whiteboardRef} height={'800px'} width={'800px'} >
      <ToolbarHolderS>
        <ColorBarS>
          {!!enabledControls.COLOR_PICKER && (
            <ToolbarItemS>
              <ColorPicker
                size={28}
                color={canvasDrawingSettings.currentColor}
                onChange={changeCurrentColor}
              ></ColorPicker>
            </ToolbarItemS>
          )}
          {!!enabledControls.BRUSH && (
            <ToolbarItemS>
              <RangeInputS
                ref={rangeInput}
                type="range"
                min={1}
                max={30}
                step={1}
                thumbColor={canvasDrawingSettings.currentColor}
                value={canvasDrawingSettings.brushWidth}
                onChange={changeBrushWidth}
              />
            </ToolbarItemS>
          )}
          {!!enabledControls.DEFAULT_COLORS && (
            <>{getColorButtons(['#6161ff', '#ff4f4f', '#3fd18d', '#ec70ff', '#000000'])}</>
          )}
          {!!enabledControls.FILL && (
            <ButtonS
              type="button"
              className={canvasDrawingSettings.fill ? 'selected' : ''}
              onClick={changeFill}
            >
              <img src={FillIcon} alt="Delete" />
            </ButtonS>
          )}
        </ColorBarS>
        <ToolbarS>
          {mode==='sketch' && sizes && (
            <SelectS onChange={sketchSizeChange}>
              {sizes.map(item=>(
                <OptionS key={item}>{item}</OptionS>
              ))}
            </SelectS>
          )}

          {getControls()}

          {!!enabledControls.CLEAR && (
            <ButtonS type="button" onClick={() => board.clearCanvas()}>
              <img src={DeleteIcon} alt="Delete" />
            </ButtonS>
          )}

          <SeparatorS />

          {!!enabledControls.FILES && (
            <ToolbarItemS>
              <input
                ref={uploadPdfRef}
                hidden
                accept="image/*,.pdf"
                type="file"
                onChange={onFileChange}
              />
              <ButtonS onClick={() => uploadPdfRef.current.click()}>
                <img src={UploadIcon} alt="Delete" />
              </ButtonS>
            </ToolbarItemS>
          )}

          {!!enabledControls.SAVE_AS_IMAGE && (
            <ToolbarItemS>
              <ButtonS onClick={handleSaveCanvasAsImage}>
                <img src={DownloadIcon} alt="Download" />
              </ButtonS>
            </ToolbarItemS>
          )}

          {!!enabledControls.SAVE_AS_IMAGE_WITHOUT_BACKGROUNDIMAGE && (
            <ToolbarItemS>
              <ButtonS onClick={handleSaveCanvasAsImageWithBackgroundImage}>
                <img src={DownloadIcon} alt="Download" />
              </ButtonS>
            </ToolbarItemS>
          )}
        </ToolbarS>
        <ZoomBarS>
          {!!enabledControls.ZOOM && (
            <ToolbarItemS>
              <ButtonS onClick={handleZoomIn} title="Zoom In">
                <img src={ZoomInIcon} alt="Zoom In" />
              </ButtonS>
            </ToolbarItemS>
          )}

          {!!enabledControls.ZOOM && (
            <ToolbarItemS>
              <ButtonS onClick={handleResetZoom} title="Reset Zoom">
                <span style={{ fontSize: '11px' }}>{Math.floor(zoom * 100)}%</span>
              </ButtonS>
            </ToolbarItemS>
          )}

          {!!enabledControls.ZOOM && (
            <ToolbarItemS>
              <ButtonS onClick={handleZoomOut} title="Zoom Out">
                <img src={ZoomOutIcon} alt="Zoom Out" />
              </ButtonS>
            </ToolbarItemS>
          )}
        </ZoomBarS>
      </ToolbarHolderS>
      <DrawPanelS>
        <canvas ref={canvasRef} id="canvas" />
      </DrawPanelS>
      <PDFWrapperS>
        <PdfReader
          fileReaderInfo={fileReaderInfo}
          onPageChange={handlePageChange}
          updateFileReaderInfo={updateFileReaderInfo}
        />
      </PDFWrapperS>
    </PaintPanelS>
    // </div>
  );
};

Whiteboard.propTypes = {
  aspectRatio: PropTypes.number,
};

export default Whiteboard;
