import React, { useState, useEffect, useRef } from 'react';
import {processPoint} from './Grid.js'
import CropCanvas from './CropCanvas';
import WarpCanvas from './WarpCanvas';
import defaultImage from './images/Test.jpg'

export default function SourceContainer ({setImage, size}) 
{
  const [srcImage, setSrcImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const editingCanvas = useRef(null);

  const [bufferImage, setBufferImage] = useState(null);
  const [toggleCrop, setToggleCrop] = useState(false);
  const [toggleWarp, setToggleWarp] = useState(false);
  const [cropCoords, setCropCoords] = useState([0, 0, size, size]);
  const [resetFlag, setResetFlag] = useState(false);

  //Hide/Show Crop interface
  const hideCrop = function()
  {
    setToggleCrop(!toggleCrop);
    setToggleWarp(false);
  }
  //Hide/Show Distort interface
  const hideWarp = function()
  {
    setToggleWarp(!toggleWarp);
    setToggleCrop(false);
  }    

  //Draws the buffered image on the editing canvas
  const drawScene = function()
  {
    const ctx = editingCanvas.current.getContext('2d')
    ctx.clearRect(0, 0, editingCanvas.current.width, editingCanvas.current.height);
    ctx.drawImage(bufferImage, 0, 0, size, size);
  }

  //Updates crop coordinates with given parameters
  const crop = function(offsetX, offsetY, width, height)
  {
    setCropCoords([offsetX, offsetY, width, height]);
  }

  //Distorts the image given the new gridPoints
  const distort = function(gridPoints, gridSize, save)
  {
    const ctx = editingCanvas.current.getContext('2d');
        
    //Clear canvas image
    ctx.clearRect(0, 0, editingCanvas.current.width, editingCanvas.current.height);
    var distortShapeData = [];
    //Distorts the image and paints it into the editing canvas
    for(let i = 0; i < gridPoints.length; i++)
    {
      processPoint(ctx, editedImage, gridPoints, gridPoints[i], gridSize, distortShapeData);
    }
    
    if(save)
    {
      //Updates de final image with the current edited image
      let newImage = new Image();
      newImage.src = editingCanvas.current.toDataURL();
      newImage.onload = () => 
      {
        setBufferImage(newImage);
        createCroppedImage(newImage);
      }
    }
  }

  //Resets the edited image with the source image
  const resetImage = function()
  {
    if(srcImage != null) 
    {
      createBufferImage(srcImage);    
    }
  }

  //Resets the crop to full size
  const resetCrop = function()
  {
    setResetFlag(true);
  }

  //Updates the source image with the uploaded image
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

  //Creates a new image for editing
  const createBufferImage = function(img)
  {
    const bufferCanvas = document.createElement('canvas');
    const bufferCtx = bufferCanvas.getContext('2d');
    bufferCanvas.width = size;
    bufferCanvas.height = size;

    //Draws edited image on canvas and generate a new image               
    bufferCtx.drawImage(img, 
      0, 0, size, size);

    let newImage = new Image();
    newImage.src = bufferCanvas.toDataURL();
    newImage.onload = () => 
    {
      setBufferImage(newImage);
      setEditedImage(newImage);
      createCroppedImage(newImage);
    }
  }

  // Creates a new context, crops the image, and sets the new edited image
  const createCroppedImage = function(img)
  {
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    cropCanvas.width = cropCoords[2];
    cropCanvas.height = cropCoords[3];

    cropCtx.drawImage(img, 
      cropCoords[0], cropCoords[1], cropCoords[2], cropCoords[3],
      0, 0, cropCoords[2], cropCoords[3]);

    let newImage = new Image();
    newImage.src = cropCanvas.toDataURL();
    newImage.onload = () => {
      setImage(newImage);
    }
  }

  // If there is no source image, use default image
  useEffect(() =>
  {
    if(srcImage == null)
    {
      let newImage = new Image();
      newImage.src = defaultImage;
      newImage.onload = () => 
      {
        setSrcImage(newImage);
        createCroppedImage(newImage);
      }
    }
  },[srcImage])

  // If source image is changed, generate a buffer image
  useEffect(() => 
  {
    if(srcImage)
    {
      createBufferImage(srcImage);
    }
  }, [srcImage, size, cropCoords])

  // If buffer image is changed, redraw the editing canvas
  useEffect(() => 
  {
    if(bufferImage && editingCanvas)
    {
      drawScene();
    }
  }, [bufferImage, editingCanvas, size])

  return (
    <div>
      <h2>Source Image</h2>
      <button onClick={hideWarp}>Distort Image</button>
      <button onClick={hideCrop}>Crop Image</button>    
      <button onClick={resetImage}>Reset Image</button>
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
      <br />
      <br />        
      <div class = "canvas-container">
        <canvas          
          ref={editingCanvas}
          width={size}
          height={size}
        />
        
        <CropCanvas
          cropFunction = {crop}
          size = {size}
          //active = {toggleCrop}
          resetFlag = {resetFlag}
          setResetFlag = {setResetFlag}
        />

        <WarpCanvas
          distortFunction = {distort}
          size = {size}
          active = {toggleWarp}
        />
                  
      </div>        
              
    </div>
  );
}