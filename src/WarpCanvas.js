import './App.css';
import {getGridPoints} from './Grid.js'
import React, { useEffect, useRef, useState } from 'react';

function getMousePos(canvas, event) 
{
    var rect = canvas.current.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.current.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.current.height
    };
}

export default function WarpCanvas({warpFunction, size, active})
{
    const canvas = useRef(null);
    const slideContainer = useRef(null);
    const gridSlider = useRef(null);

    const gridPoints = useRef([]);
    const nodes = useRef([]);
    const [numNodes, setNumNodes] = useState(15);

    const warpNodes = useRef([]);
    const radiusSlider = useRef(null);
    const [warpRadius, setWarpRadius] = useState(50);

    const lastTime = useRef(0); //last time warp was applied
    const nodeRadius = 5;
    const nodeColor = 'cyan';

    const strokeColor = "rgba(255, 255, 255, 0.5)";

    let isDragging = false;
    let startX, startY;
    let lastX, lastY;
    let minTimeDiff = 30; //minimum time difference to apply warp

    const setNodes = function(event) 
    {
        setNumNodes(parseInt(event.currentTarget.value) + 1);
    }

    const setRadius = function(event)
    {
        setWarpRadius(parseInt(event.currentTarget.value));
    }

    const newGrid = function()
    {
        const n = numNodes-1;
        const offsetX = Math.floor(size/n * 10) / 10;
        const offsetY = Math.floor(size/n * 10) / 10;
        gridPoints.current = getGridPoints(size, size, offsetX, offsetY);
        createNodes();
    }

    const createNodes = function()
    {
        nodes.current.length = 0;
        let i = 0;
        for(let point of gridPoints.current)
        {
            nodes.current.push({
                x: point.x, 
                y: point.y,
                column: point.column,
                row: point.row,
                index: i,
                radius: nodeRadius, 
                color:nodeColor
            });
            i++;
        }
        if(canvas.current) drawGrid();
    }

    const resetGrid = function(w, h, gridSize)
    {
        let i = 0;
        for(let y = 0; y <= h; y += gridSize){
            for(let x = 0; x <= w; x += gridSize){
                gridPoints.current[i].x = x;
                gridPoints.current[i].y = y;
                gridPoints.current[i].x_end = x;
                gridPoints.current[i].y_end = y;
                i++;
            }
        }
        updateNodes();
    }

    const updateNodes = function()
    {
        let i = 0;
        for(let point of gridPoints.current){
            nodes.current[i].x = point.x;
            nodes.current[i].y = point.y;
            i++;
        }
    }    
    
    const drawGrid = function()
    {
        var ctx = canvas.current.getContext('2d');
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        for(let i = 0; i < numNodes; i++)
        {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = strokeColor; 
            ctx.moveTo(nodes.current[i].x, nodes.current[i].y);
            for(let k = 1; k < numNodes; k++)
            {
                ctx.lineTo(nodes.current[i+numNodes*k].x, nodes.current[i+numNodes*k].y);
            }
            ctx.stroke();           
        }
        
        for(let j = 0; j < nodes.current.length; j+=numNodes)
        {
            ctx.beginPath();
            ctx.moveTo(nodes.current[j].x, nodes.current[j].y);
            for(let k = 1; k < numNodes; k++){
                ctx.lineTo(nodes.current[j+k].x, nodes.current[j+k].y);
            }           
            ctx.stroke();            
        }
    }

    const drawWarpRadius = function(pos)
    {
        var ctx = canvas.current.getContext('2d');
        if(pos)
        {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, warpRadius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
        }      
    }
    
    const createWarpNodes = function() 
    {
        for(let node of nodes.current)
        {
            if(node.column !== 0 && node.row !== 0 
                && node.column !== (numNodes-1) && node.row !== (numNodes-1))
            {
                let dist = distanceNodePoint(node, startX, startY);
                if(dist < warpRadius)
                {
                    node.distance = dist;
                    warpNodes.current.push(node);
                    isDragging = true;
                }
            }                  
        }
    }

    const distanceNodePoint = function(node, pointX, pointY)
    {
        const dx = pointX - node.x;
        const dy = pointY - node.y;
        return Math.hypot(dx, dy);
    }

    const displaceNodes = function(dx, dy)
    {
        for(let node of warpNodes.current)
        {
            //Distance factor
            const k = (warpRadius - node.distance) / warpRadius;
            //Calculate new node position
            node.x = Math.max(0, Math.min(node.x + (dx * k), size));
            node.y = Math.max(0, Math.min(node.y + (dy * k), size));

            //Update nodes and gridPoints arrays
            nodes.current[node.index] = node;
            gridPoints.current[node.index].x_end = node.x;
            gridPoints.current[node.index].y_end = node.y;
        }
    }

    const mouseDown = function(event) 
    {
        let pos = getMousePos(canvas, event);
        startX = pos.x;
        startY = pos.y;
        lastX = startX;
        lastY = startY;
        
        createWarpNodes();
    }
  
    const mouseMove = function(event) 
    {
        let currentTime = Date.now();
        let pos = getMousePos(canvas, event);

        if(isDragging)
        {                        
            let dx = pos.x - lastX;
            let dy = pos.y - lastY;

            displaceNodes(dx, dy);
          
            if((currentTime - lastTime.current) > minTimeDiff)
            {
                const n = numNodes-1;
                const gridSize = size/n;
                warpFunction(gridPoints.current, gridSize, false);
                        
                lastTime.current = currentTime;
            }
        }
        //Draw grid and warp radius
        drawGrid();
        drawWarpRadius(pos);

        lastX = pos.x;
        lastY = pos.y;
    }

    const mouseUp = function(event)
    {
        if(isDragging)
        {
            isDragging = false;
            warpNodes.current.length = 0;
            const n = numNodes-1;
            const gridSize = size/n;
            warpFunction(gridPoints.current, gridSize, true);                                   
        }              
    }

    useEffect(() => {
        if(canvas)
        {
            const n = numNodes-1;
            const gridSize = size/n;
            resetGrid(size, size, gridSize);
            drawGrid();           
        }    
    }, [canvas, size])

    useEffect(() => {
        if(canvas)
        {
            newGrid();
        }    
    }, [numNodes])

    useEffect(() => {
        if(active)
        {
            canvas.current.removeAttribute("hidden");
            slideContainer.current.style.display = "block";
        } 
        else 
        {
            canvas.current.setAttribute("hidden", "hidden");
            slideContainer.current.style.display = "none";
        }
    }, [active])

    if(gridPoints.current.length <= 0)
    {
        newGrid();
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
            <div ref = {slideContainer} class = "slideContainer">
                <button onClick={newGrid}>Reset Grid</button>
                <br />
                <p>
                    Warp Radius: 
                    <span> {warpRadius}</span> 
                    x
                    <span>{warpRadius}</span>
                </p>               
                <input 
                    ref = {radiusSlider}
                    class = "radiusSlider"
                    type="range" 
                    min = "10" 
                    max = "200"
                    value = {warpRadius}
                    step = "1"           
                    id = "radiusRange"
                    onChange = {setRadius}           
                />
                <br />
                <p>
                    Tiles: 
                    <span> {numNodes-1}</span> 
                    x
                    <span>{numNodes-1}</span>
                </p>               
                <input 
                    ref = {gridSlider}
                    class = "gridSlider"
                    type="range" 
                    min = "8" 
                    max = "24"
                    value = {numNodes-1}
                    step = "1"           
                    id = "gridRange"
                    onChange = {setNodes}           
                />                               
            </div>
        </div>             
    );
}