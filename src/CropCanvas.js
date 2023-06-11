import './App.css';
import React, { useEffect, useRef } from 'react';

// Returns the mouse position relative to the canvas given as parameter
function getMousePos(canvas, event) {
    var rect = canvas.current.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.current.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.current.height
    };
}

export default function CropCanvas ({cropFunction, size, resetFlag, setResetFlag}) {    
    const canvas = useRef(null);
    const boundaries = useRef(new Array());
    const shapes = useRef(new Array());
    const shapeSize = 15;
    const shapeColor = 'cyan';
    
    let currentShapeIndex = null;
    let isDragging = false;
    let startX, startY;
    let centerX, centerY;

    //Resets the crop boundaries
    const resetBoundaries = function(){
        boundaries.current[0] = 0;  //left
        boundaries.current[1] = size-shapeSize; //right
        boundaries.current[2] = 0;  //top
        boundaries.current[3] = size-shapeSize; //bottom
        centerX = (boundaries.current[0] + boundaries.current[1])/2;
        centerY = (boundaries.current[2] + boundaries.current[3])/2;
    }

    //Updates the crop boundaries to the shape positions
    const updatePositions = function()
    {
      shapes.current[0].x = boundaries.current[0];
      shapes.current[0].y = boundaries.current[2];

      shapes.current[1].x = boundaries.current[1];
      shapes.current[1].y = boundaries.current[2];

      shapes.current[2].x = boundaries.current[0];
      shapes.current[2].y = boundaries.current[3];

      shapes.current[3].x = boundaries.current[1];
      shapes.current[3].y = boundaries.current[3];

      shapes.current[4].x = (boundaries.current[0] + boundaries.current[1])/2;
      shapes.current[4].y = (boundaries.current[2] + boundaries.current[3])/2;
    }

    //Detects if the mouse is inside a shape
    const isMouseInside = function(x, y, shape)
    {
        if(x > shape.x && x < (shape.x+shape.width)
        && y > shape.y && y < (shape.y+shape.height))
        {
            return true;
        }
        return false; 
    }

    //If a shape has been clicked start dragging
    const mouseDown = function(event) 
    {
        let pos = getMousePos(canvas, event);
        startX = pos.x;
        startY = pos.y;
        let index = 0;
        for(let shape of shapes.current)
        {
            if(isMouseInside(startX, startY, shape))
            {
                currentShapeIndex = index;
                isDragging = true;
                return;
            }       
            index++;
        }
    }
    
    // Updates the UI and the crop boundaries while the shapes are being dragged
    const mouseMove = function(event) 
    {
        if(isDragging)
        {
            let pos = getMousePos(canvas, event);
            let dx = pos.x - startX;
            let dy = pos.y - startY;
    
            let currentShape = shapes.current[currentShapeIndex];
            currentShape.x = Math.max(0, Math.min(currentShape.x + dx, size - shapeSize));
            currentShape.y = Math.max(0, Math.min(currentShape.y + dy, size - shapeSize));
    
            switch(currentShapeIndex)
            {
                case 0:
                    boundaries.current[0] = currentShape.x;
                    boundaries.current[2] = currentShape.y;
                    break;
                case 1:
                    boundaries.current[1] = currentShape.x;
                    boundaries.current[2] = currentShape.y;
                    break;
                case 2:
                    boundaries.current[0] = currentShape.x;
                    boundaries.current[3] = currentShape.y;
                    break;
                case 3:
                    boundaries.current[1] = currentShape.x;
                    boundaries.current[3] = currentShape.y;
                    break;
                case 4:
                    centerX = currentShape.x;
                    centerY = currentShape.y;
                    boundaries.current[0] = Math.max(0, Math.min(boundaries.current[0] + dx, size - shapeSize));
                    boundaries.current[1] = Math.max(0, Math.min(boundaries.current[1] + dx, size - shapeSize));
                    boundaries.current[2] = Math.max(0, Math.min(boundaries.current[2] + dy, size - shapeSize));
                    boundaries.current[3] = Math.max(0, Math.min(boundaries.current[3] + dy, size - shapeSize));
                    break;
                default:
                    break;
          }
  
          updatePositions();
          drawShapes();
          startX = pos.x;
          startY = pos.y;                  
        }
    }

    // Apply the crop when the mouse click is released
    const mouseUp = function()
    {
        if(isDragging)
        {
            isDragging = false;
            var w = boundaries.current[1] - boundaries.current[0] + shapeSize;
            var h = boundaries.current[3] - boundaries.current[2] + shapeSize;
            cropFunction(boundaries.current[0], boundaries.current[2], w, h);  
        }              
    }

    // Draws the cropping UI
    let drawShapes = function() 
    {
        const ctx = canvas.current.getContext('2d')
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        
        for(let shape of shapes.current)
        {
            ctx.fillStyle = shape.color;         
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        }
        
        ctx.strokeStyle = shapeColor;
        ctx.beginPath();
        ctx.moveTo(boundaries.current[0], boundaries.current[2]);
        ctx.lineTo(boundaries.current[0], boundaries.current[3] + shapeSize - 1);
        ctx.lineTo(boundaries.current[1] + shapeSize - 1, boundaries.current[3] + shapeSize - 1);
        ctx.lineTo(boundaries.current[1] + shapeSize - 1, boundaries.current[2]);
        ctx.lineTo(boundaries.current[0], boundaries.current[2]);        
        ctx.stroke();
        ctx.closePath();       
    }

    // Resets the crop
    const resetCrop = function()
    {
        resetBoundaries();
        updatePositions();
        drawShapes();

        var w = boundaries.current[1] - boundaries.current[0] + shapeSize;
        var h = boundaries.current[3] - boundaries.current[2] + shapeSize;
        cropFunction(boundaries.current[0], boundaries.current[2], w, h);

        setResetFlag(false);
    }

    // If the canvas or the size of the canvas is modified, reset the crop
    useEffect(() => {
        if(canvas)
        {
            resetCrop();
        }    
    }, [canvas, size])

    // If SourceContainer sets resetFlag to true, reset the crop
    useEffect(() => {
        if(resetFlag)
        {
            resetCrop();           
        }    
    }, [resetFlag])

    /*
    // Hide crop canvas
    useEffect(() => {
        if(active)
        {
            canvas.current.removeAttribute("hidden");
        } 
        else 
        {
            canvas.current.setAttribute("hidden", "hidden");
        }
    }, [active])
    */

    // Generates the cropping shapes at start
    if(shapes.current.length <= 0)
    {
        resetBoundaries();
        shapes.current.push({x:boundaries.current[0], y:boundaries.current[2], width: shapeSize, height: shapeSize, color:shapeColor});
        shapes.current.push({x:boundaries.current[1], y:boundaries.current[2], width: shapeSize, height: shapeSize, color:shapeColor});
        shapes.current.push({x:boundaries.current[0], y:boundaries.current[3], width: shapeSize, height: shapeSize, color:shapeColor});
        shapes.current.push({x:boundaries.current[1], y:boundaries.current[3], width: shapeSize, height: shapeSize, color:shapeColor});
        shapes.current.push({x:centerX, y:centerY, width: shapeSize, height: shapeSize, color:shapeColor});
    }

    return(
        <div>          
            <canvas 
            class={"canvas-UI"}        
            ref={canvas}
            width={size}
            height={size}
            onMouseDown={mouseDown}
            onMouseUp={mouseUp}
            onMouseOut = {mouseUp}
            onMouseMove={mouseMove}
            />
            <br />
            <br />         
        </div>      
    );
}

