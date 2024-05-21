"use client";

import { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { RoughCanvas } from "roughjs/bin/canvas";

type Point = {
  x: number;
  y: number;
};

type Shape = {
  tool: string;
  startPosition: Point;
  endPosition: Point;
};

const tools = ["pencil", "rectangle", "circle", "arrow"];
const generator = rough.generator()

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState("circle");
  const [isDrawing, setDrawing] = useState(false);
  const [startPosition, setStartPosition] = useState<Point>({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState<Point>({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const roughCanvas: RoughCanvas = rough.canvas(canvas);

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      shapes.forEach((shape) => {
        drawShape(roughCanvas, shape);
      });
      if (isDrawing) {
        drawShape(roughCanvas, {
          tool: selectedTool,
          startPosition,
          endPosition: currentPosition,
        });
      }
    };

    const drawShape = (roughCanvas: RoughCanvas, shape: Shape) => {
      const { tool, startPosition, endPosition } = shape;
      switch (tool) {
        case "rectangle":
          roughCanvas.rectangle(
            startPosition.x,
            startPosition.y,
            endPosition.x - startPosition.x,
            endPosition.y - startPosition.y
          );
          break;
        case "pencil":
          // Add pencil drawing logic here
          break;
        case "circle":
          const radius = Math.sqrt(
            Math.pow(endPosition.x - startPosition.x, 2) +
              Math.pow(endPosition.y - startPosition.y, 2)
          );
          roughCanvas.circle(startPosition.x, startPosition.y, radius * 2);
          break;
        case "arrow":
          // Add arrow drawing logic here
          roughCanvas.line(
            startPosition.x,
            startPosition.y,
            currentPosition.x,
            currentPosition.y
          )
          break;
        default:
          break;
      }
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      setCurrentPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        setShapes((prevShapes) => [
          ...prevShapes,
          {
            tool: selectedTool,
            startPosition,
            endPosition: currentPosition,
          },
        ]);
        setDrawing(false);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [startPosition, currentPosition, isDrawing, selectedTool, shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStartPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrentPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDrawing(true);
    console.log(startPosition);
  };

  return (
    <main className="flex justify-center items-center overflow-hidden max-h-screen">
      <div className="absolute bg-slate-700 flex top-6 list-none gap-5 h-10 items-center p-3 rounded-xl">
        {tools.map((item, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded-md ${
              selectedTool === item
                ? " text-gray-300 bg-gray-600"
                : " text-gray-100"
            }`}
            onClick={() => setSelectedTool(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={2000}
        height={2000}
        style={{ backgroundColor: "#212121" }}
        onMouseDown={handleMouseDown}
      ></canvas>
    </main>
  );
}
