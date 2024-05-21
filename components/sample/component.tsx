"use client";

import React, { useRef, useEffect, useState } from "react";
import rough from "roughjs";


//Types for Points
interface Position {
  x: number;
  y: number;
}

//Types for Shapes
interface Rectangle {
  shape: any;
  options?: any;
}

//main canvas component
const RoughCanvasComponent: React.FC = () => {
  // initaialization of states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<Position>({ x: 0, y: 0 });
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
 // const [dimension , setDinension] = useState({width : window.innerWidth, height : window.innerHeight})

/*   useEffect(()=>{
    const handleChange =()=>{
      setDinension({
        width : window.innerWidth,
        height : window.innerHeight
      })
    }
    window.addEventListener("resize", handleChange);

    return () => {
      window.removeEventListener('resize', handleChange)
    }
  },[]) */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const roughCanvas = rough.canvas(canvas);

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      rectangles.forEach((rect) => {
        roughCanvas.draw(rect.shape);
      });
      if (isDrawing) {
        const rect = roughCanvas.generator.rectangle(
          startPos.x,
          startPos.y,
          currentPos.x - startPos.x,
          currentPos.y - startPos.y,
        );
        roughCanvas.draw(rect);
      }
    };

    draw();
  }, [isDrawing, startPos, currentPos, rectangles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    const roughCanvas = rough.canvas(canvasRef.current as HTMLCanvasElement);
    const newRect = roughCanvas.generator.rectangle(
      startPos.x,
      startPos.y,
      currentPos.x - startPos.x,
      currentPos.y - startPos.y
    );
    setRectangles((prevRectangles) => [...prevRectangles, { shape: newRect }]);
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ backgroundColor: "#212121" }}
    ></canvas>
  );
};

export default RoughCanvasComponent;
