import './App.css';
import React, { useState, useEffect, useRef } from 'react';

export default function TiledContainer ({image, size}) 
{
    const canvas = useRef(null);
    const tileSlider = useRef(null);
    const [numTiles, setNumTiles] = useState(3);
    const filename = "warpedImage.png";

    // Update the number of tiles
    const setTiles = function(event) 
    {
      setNumTiles(event.currentTarget.value);
    }

    //Dowloads the edited image
    const downloadImage = function()
    {
      if(image)
      {
        const imgSrc = image.src;
        const a = Object.assign(document.createElement("a"), {
          href: imgSrc,
          style: "display: none",
          download: filename,
        });
        document.body.appendChild(a)
        a.click();
        a.remove();        
      }
    }

    // Draw the tiled image when dependencies change
    useEffect(() => {
      if(image  && canvas)
      {
        const ctx = canvas.current.getContext('2d')
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
  
        // Calculate the dimensions for cropping the image into tiles
        let cropWidth = image.width / numTiles;
        let cropHeight = image.height / numTiles;
        let widthTiles = (size/cropWidth);
        let heightTiles = (size/cropHeight);

        // Draw the cropped tiles on the canvas
        for(let i=0; i<heightTiles; i++)
        {
          for(let j=0; j<widthTiles; j++)
          {
            ctx.drawImage(image, j*cropWidth, i*cropHeight, cropWidth, cropHeight);
          }
        }
      }
    }, [image, canvas, size, numTiles])
  
  
    return (
      <div>
        <h2>Tiled Image</h2>
        <div>
          <canvas
            ref={canvas}
            width={size}
            height={size}
          />
        </div>
        <div class = "slideContainer">
          <p>Number of Tiles</p>
          <input 
            ref = {tileSlider}
            class = "slider"
            type="range" 
            min = "1" 
            max = "8"
            value = {numTiles}
            step = "1"           
            id = "myRange"
            onChange = {setTiles}           
          />         
        </div>
        <br />
        <br />
        <button
          onClick = {downloadImage}
        >
          Donwload Image
        </button>
      </div>
    );
  }