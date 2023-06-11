//Generate grid points given image and tile size
export function getGridPoints(width, height, gridSize)
{
    var gridPoints = [];
    var index = 0;
    var column = 0;
    var row = 0;

    //Creates grid points assigning index, row, column and coordinates
    for(let i = 0; i <= height; i += gridSize)
    {
        column = 0;
        for(let j = 0; j <= width; j += gridSize){
            gridPoints[index] = 
                {
                    x: j,
                    y: i,
                    x_end: j,
                    y_end: i,
                    distance: 0,
                    column: column,
                    row: row,                   
                    index: index,
                    pixelIndex: (i * width + j) * 4
                };
            index++;
            column++;
        }
        row++;
    }

    gridPoints.rows = row;
    gridPoints.columns = column;

    return gridPoints;
}

export function processPoint(ctx, image, points, p1, gridSize, distortShapeData)
{
    // Get the neighboring points for the current point.
    var p2 = getItemByValues(points, 'row', p1.row, 'column', p1.column + 1);
    var p3 = getItemByValues(points, 'row', p1.row + 1, 'column', p1.column);
    var p4 = getItemByValues(points, 'row', p1.row + 1, 'column', p1.column +1);

    // Set an offset value for drawing the triangles.
    var offset = 1;

    if(p1 && p2 && p3 && p4)
    {
        // Calculate the transformation matrices for the first triangle.
        var xm = getLinearSolution(
            0, 0, p1.x_end, 
            gridSize, 0, p2.x_end, 
            0, gridSize, p3.x_end);
        var ym = getLinearSolution(
            0, 0, p1.y_end, 
            gridSize, 0, p2.y_end, 
            0, gridSize, p3.y_end);
        
        // Save the current context state and apply the transformation matrix.
        ctx.save();
        ctx.setTransform(xm[0], ym[0], xm[1], ym[1], xm[2], ym[2]);
        
        // Begin drawing the first triangle by defining its path.
        ctx.beginPath();
        ctx.moveTo(-offset, -offset);
        ctx.lineTo(gridSize + offset, -offset);
        ctx.lineTo(-offset, gridSize + offset);
        ctx.lineTo(-offset, -offset);
        ctx.closePath();

        // Clip the current context to the defined path.
        ctx.clip();
         // Draw the image onto the clipped area and restore the previous context state.
        ctx.drawImage(image, p1.x, p1.y, gridSize, gridSize, -offset, -offset, gridSize + offset, gridSize + offset);
        ctx.restore();       

        //Second triangle
        var xn = getLinearSolution(
            gridSize, gridSize, p4.x_end, 
            gridSize, 0, p2.x_end, 
            0, gridSize, p3.x_end);
        var yn = getLinearSolution(
            gridSize, gridSize, p4.y_end, 
            gridSize, 0, p2.y_end, 
            0, gridSize, p3.y_end);

        ctx.save();
        ctx.setTransform(xn[0], yn[0], xn[1], yn[1], xn[2], yn[2]);
        
        ctx.beginPath();
        ctx.moveTo(gridSize, gridSize);
        ctx.lineTo(gridSize, 0);
        ctx.lineTo(gridSize -offset, 0);
        ctx.lineTo(-offset, gridSize);
        ctx.lineTo(0, gridSize);
        ctx.lineTo(gridSize, gridSize);
        ctx.closePath();

        ctx.clip();
        ctx.drawImage(image, p1.x, p1.y, gridSize, gridSize, -offset, -offset, gridSize + offset, gridSize + offset);
        ctx.restore();

        //Save distort Data
        distortShapeData.push({
            points: [
                {x: p1.x, y: p1.y},
                {x: p2.x, y: p2.y},
                {x: p3.x, y: p3.y},
                {x: p4.x, y: p4.y}
            ],
            transforms: {
                shape: {
                    scaleX: xm[0],
                    skewY: ym[0],
                    skewX: xm[1],
                    scaleY: ym[1],
                    translateX: xm[2],
                    translateY: ym[2]
                },
                image: {
                    scaleX: xn[0],
                    skewY: yn[0],
                    skewX: xn[1],
                    scaleY: yn[1],
                    translateX: xn[2],
                    translateY: yn[2]
                }
            }
        });
    }
}

// Calculate the linear solution of a system of equations with three variables.
function getLinearSolution(r1, s1, t1, r2, s2, t2, r3, s3, t3)
{
    // Parsing the input values to ensure they are treated as numbers.
    r1 = parseFloat(r1);
    s1 = parseFloat(s1);
    t1 = parseFloat(t1);
    r2 = parseFloat(r2);
    s2 = parseFloat(s2);
    t2 = parseFloat(t2);
    r3 = parseFloat(r3);
    s3 = parseFloat(s3);
    t3 = parseFloat(t3);
    // Calculating the values of 'a', 'b', and 'c' in the linear equation.
    var a = (((t2 - t3) * (s1 - s2)) - ((t1 - t2) * (s2 - s3))) 
        / (((r2 - r3) * (s1 - s2)) - ((r1 - r2) * (s2 - s3)));
    var b = (((t2 - t3) * (r1 - r2)) - ((t1 - t2) * (r2 - r3)))
        / (((s2 - s3) * (r1 - r2)) - ((s1 - s2) * (r2 - r3)));
    var c = t1 - (r1 * a) - (s1 * b);

    return [a, b, c];
}

// This function retrieves an item from an array of items based on specified key-value pairs.
export function getItemByValues(items, key, value, key2, value2)
{
    var result;
    const len = items.length;

    // Iterating through the items array to find a match.
    for(let i = 0; i < len; i++)
    {
        if(items[i][key] === value && items[i][key2] === value2){
            result = items[i];
            break;
        }
    }
    return result;
}