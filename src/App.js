import React, { useEffect, useRef, useState } from 'react';
import { Paintboard, Whiteboard } from './lib/index.js';
import styles from './app.module.scss';

const initJSON = `{"version":"5.3.0","objects":[{"type":"textbox","version":"5.3.0","originX":"left","originY":"top","left":282,"top":210,"width":320.47,"height":89.27,"fill":"#000000","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"fontFamily":"Times New Roman","fontWeight":"normal","fontSize":79,"text":"Draw","underline":false,"overline":false,"linethrough":false,"textAlign":"left","fontStyle":"normal","lineHeight":1.16,"textBackgroundColor":"","charSpacing":0,"styles":[],"direction":"ltr","path":null,"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","minWidth":20,"splitByGrapheme":false}]}`;
const secondJSON = `{"version":"5.3.0","objects":[{"type":"textbox","version":"5.3.0","originX":"left","originY":"top","left":282,"top":210,"width":320.47,"height":89.27,"fill":"#000000","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"fontFamily":"Times New Roman","fontWeight":"normal","fontSize":79,"text":"Draw","underline":false,"overline":false,"linethrough":false,"textAlign":"left","fontStyle":"normal","lineHeight":1.16,"textBackgroundColor":"","charSpacing":0,"styles":[],"direction":"ltr","path":null,"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","minWidth":20,"splitByGrapheme":false},{"type":"textbox","version":"5.3.0","originX":"left","originY":"top","left":426,"top":337,"width":179.79,"height":89.27,"fill":"#000000","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"fontFamily":"Times New Roman","fontWeight":"normal","fontSize":79,"text":"here","underline":false,"overline":false,"linethrough":false,"textAlign":"left","fontStyle":"normal","lineHeight":1.16,"textBackgroundColor":"","charSpacing":0,"styles":[],"direction":"ltr","path":null,"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","minWidth":20,"splitByGrapheme":false}]}`;

const App = () => {
  const [settings, setSettings] = useState();

  const [exportImg, setExportImg] = useState();

  const imageEle = useRef(null);

  useEffect(() => {
    setSettings({ contentJSON: initJSON });
    // setTimeout(() => {
    //   setSettings({ contentJSON: secondJSON, viewportTransform: [1, 0, 0, 1, 0, 0] });
    // }, 1000);
  }, []);

  useEffect(()=>{
    console.log(exportImg);
  }, [exportImg]);

  const sizes=['512x512','800x600','600x800','1920x1080']
  const controls = {
    PENCIL: true,
    MOVE: true,
    ERASERDRAW: true,
    CLEAR: true,
    FILL: true,
    BRUSH: true,
    COLOR_PICKER: true,
    DEFAULT_COLORS: true,
    FILES: true,
    SAVE_AS_IMAGE: false,
    SAVE_AS_IMAGE_WITHOUT_BACKGROUNDIMAGE: false,
    EXPORT_IMAGE: true,
    EXPORT_IMAGE_WITHOUT_BACKGROUNDIMAGE: false,
    ZOOM: true,
  }
  return (
    <div className={styles.app}>
      <main>
        <Paintboard
          maxWidth={760}
          maxHeight={760}
          mode={'sketch'}
          sizes={sizes}
          settings={settings}
          controls={controls}
          backgroundImage={imgdata}
          onCanvasRender={(data) => {
            // console.log('onCanvasRender', data);
            // console.log('JSON', JSON.stringify(data.settings.contentJSON));
          }}
          onExportBlob={(data) => {
            console.log(data);
            setExportImg(data);
            // imageEle.current.src=data;
          }}
        />
        <img ref={imageEle} src={exportImg} onLoad={(e)=>{console.log(e);}}></img>
      </main>
    </div>
  );
};

export default App;
