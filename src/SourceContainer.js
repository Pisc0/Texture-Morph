import React, { useState, useEffect, useRef } from 'react';
import {processPoint} from './Grid.js'
import CropCanvas from './CropCanvas';
import WarpCanvas from './WarpCanvas';

export default function SourceContainer ({setImage, size}) 
{
  const [srcImage, setSrcImage] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const srcCanvas = useRef(null);

  const [bufferImage, setBufferImage] = useState(null);
  const [toggleCrop, setToggleCrop] = useState(false);
  const [toggleWarp, setToggleWarp] = useState(false);

  const [cropOffsetX, setCropOffestX] = useState(0);
  const [cropOffsetY, setCropOffestY] = useState(0);
  const [cropWidth, setCropWidth] = useState(size);
  const [cropHeight, setCropHeight] = useState(size);

  //Hide/Show Crop interface
  const hideCrop = function()
  {
    setToggleCrop(!toggleCrop);
    setToggleWarp(false);
  }
  //Hide/Show warp interface
  const hideWarp = function()
  {
    setToggleWarp(!toggleWarp);
    setToggleCrop(false);
  }    

  const drawScene = function()
  {
    const ctx = srcCanvas.current.getContext('2d')
    ctx.clearRect(0, 0, srcCanvas.current.width, srcCanvas.current.height);
    ctx.drawImage(bufferImage, 0, 0, size, size);
  }

  const crop = function(offsetX, offsetY, width, height)
  {
    setCropOffestX(offsetX);
    setCropOffestY(offsetY);
    setCropWidth(width);
    setCropHeight(height);
    
    //Create a new image from source
    let img = new Image();
    img.src = srcCanvas.current.toDataURL();
    createCroppedImage(img);
  }

  const warp = function(gridPoints, gridSize, save)
  {
    const ctx = srcCanvas.current.getContext('2d');
        
    //Clear canvas image
    ctx.clearRect(0, 0, srcCanvas.current.width, srcCanvas.current.height);
    var distortShapeData = [];
    //Distort image
    for(let i = 0; i < gridPoints.length; i++){
      processPoint(ctx, resizedImage, gridPoints, gridPoints[i], gridSize, distortShapeData);
    }
    
    if(save)
    {
      const imgScan = ctx.getImageData(0, 0, size, size);
    
      ctx.putImageData(imgScan, 0, 0);
      let newImage = new Image();
      newImage.src = srcCanvas.current.toDataURL();
      newImage.onload = () => 
      {
        setBufferImage(newImage);
        createCroppedImage(newImage);
      }
    }
  }

  const resetSourceImage = function()
  {
    if(srcImage != null) 
    {
      createBufferImage(srcImage);    
    }
  }

  const resetCrop = function()
  {

  }

  const imageHandler = (e) => 
  {
    let reader = new FileReader();
    let newImage = new Image();

    reader.onload = () => 
    {
      if(reader.readyState === 2)
      {
        newImage.src = reader.result;
        newImage.onload = () => 
        {
          setSrcImage(newImage);
          createBufferImage(newImage);                
        }
      }
    }
    reader.readAsDataURL(e.target.files[0]);
  }

  const createBufferImage = function(img)
  {
    const bufferCanvas = document.createElement('canvas');
    const bufferCtx = bufferCanvas.getContext('2d');
    bufferCanvas.width = size;
    bufferCanvas.height = size;

    //Draw source on canvas and generate a new image               
    bufferCtx.drawImage(img, 
      0, 0, size, size);

    let newImage = new Image();
    newImage.src = bufferCanvas.toDataURL();
    newImage.onload = () => 
    {
      setBufferImage(newImage);
      setResizedImage(newImage);
      createCroppedImage(newImage);
    }
  }

  const createCroppedImage = function(img)
  {
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;   

    cropCtx.drawImage(img, 
      cropOffsetX, cropOffsetY, cropWidth, cropHeight,
      0, 0, cropCanvas.width, cropCanvas.height);

    let newImage = new Image();
    newImage.src = cropCanvas.toDataURL();
    newImage.onload = () => {
      setImage(newImage);
    }
  }

  useEffect(() => 
  {
    if(srcImage)
    {
      createBufferImage(srcImage);
    }
  }, [srcImage, size])

  useEffect(() => 
  {
    if(bufferImage && srcCanvas)
    {
      drawScene();
    }    
  }, [bufferImage, srcCanvas, size])

  return (
    <div>
      <h2>Source Image</h2>
      <button onClick={hideWarp}>Warp Image</button>
      <button onClick={hideCrop}>Crop Image</button>    
      <button onClick={resetSourceImage}>Reset Image</button>
      <button onClick={resetCrop}>Reset Crop</button>
      <br />
      <br />
      <input 
        type="file" 
        name ="image-upload" 
        id="input" 
        accept="image/*" 
        onChange ={imageHandler}
      />        
      <div class = "canvas-container">
        <canvas          
          ref={srcCanvas}
          width={size}
          height={size}
        />
        
        <CropCanvas
          cropFunction = {crop}
          size = {size}
          active = {toggleCrop}
        />

        <WarpCanvas
          warpFunction= {warp}
          size = {size}
          active = {toggleWarp}
        />
                  
      </div>        
              
    </div>
  );
}