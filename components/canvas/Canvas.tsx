"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";

type Point = {
  x: number;
  y: number;
};

type Shape = {
  tool: string;
  startPoint?: Point;
  endPoint?: Point;
  points?: Point[];
  color: string;
};

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [tool, setTool] = useState<string>("pencil"); // Default tool
  const [shapes, setShapes] = useState<Shape[]>([]); // Array to store shapes
  const lineWidth = 2; // Adjust as needed
  const [lineColor, setLineColor] = useState("#FFFFFF"); // Adjust as needed

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Handle null case for canvas reference

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Handle null case for canvas context

    const drawShape = (shape: Shape) => {
      ctx.strokeStyle = shape.color; // Set the color for each shape
      ctx.lineWidth = lineWidth;

      if (shape.tool === "rectangle") {
        if (shape.startPoint && shape.endPoint) {
          drawRectangle(ctx, shape.startPoint, shape.endPoint);
        }
      } else if (shape.tool === "line") {
        if (shape.startPoint && shape.endPoint) {
          drawLine(ctx, shape.startPoint, shape.endPoint);
        }
      } else if (shape.tool === "circle") {
        if (shape.startPoint && shape.endPoint) {
          drawCircle(ctx, shape.startPoint, shape.endPoint);
        }
      } else if (shape.tool === "pencil") {
        if (shape.points) {
          drawPencil(ctx, shape.points);
        }
      }
    };

    const drawRectangle = (
      ctx: CanvasRenderingContext2D,
      start: Point,
      end: Point
    ) => {
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.beginPath();
      ctx.rect(start.x, start.y, width, height);
      ctx.stroke();
    };

    const drawLine = (
      ctx: CanvasRenderingContext2D,
      start: Point,
      end: Point
    ) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    };

    const drawCircle = (
      ctx: CanvasRenderingContext2D,
      start: Point,
      end: Point
    ) => {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    };

    const drawPencil = (ctx: CanvasRenderingContext2D, points: Point[]) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      const start = { x: e.offsetX, y: e.offsetY };
      setStartPoint(start);

      if (tool === "pencil") {
        setShapes((prevShapes) => [
          ...prevShapes,
          { tool, points: [start], color: lineColor },
        ]);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const current = { x: e.offsetX, y: e.offsetY };
      setCurrentPoint(current);

      if (tool === "pencil") {
        setShapes((prevShapes) => {
          const updatedShapes = [...prevShapes];
          const lastShape = updatedShapes[updatedShapes.length - 1];
          if (lastShape && lastShape.points) {
            lastShape.points.push(current);
          }
          return updatedShapes;
        });
      }

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        shapes.forEach((shape) => drawShape(shape));
        if (tool === "rectangle" && startPoint) {
          drawRectangle(ctx, startPoint, current);
        } else if (tool === "line" && startPoint) {
          drawLine(ctx, startPoint, current);
        } else if (tool === "circle" && startPoint) {
          drawCircle(ctx, startPoint, current);
        } else if (tool === "pencil" && shapes.length > 0) {
          const lastShape = shapes[shapes.length - 1];
          if (lastShape && lastShape.points) {
            drawPencil(ctx, lastShape.points);
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (tool !== "pencil") {
        setShapes((prevShapes) => [
          ...prevShapes,
          {
            tool,
            startPoint: startPoint!,
            endPoint: currentPoint!,
            color: lineColor,
          },
        ]);
      }
      setStartPoint(null);
      setCurrentPoint(null);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDrawing, startPoint, currentPoint, tool, shapes, lineColor]);

  return (
    <main className="flex relative justify-center items-center overflow-hidden max-h-screen">
      <div className="absolute bg-slate-700 flex top-6 list-none gap-5 h-10 items-center p-3 rounded-xl">
        <button onClick={() => setTool("pencil")}>
          <Image
            src={"https://img.icons8.com/plasticine/100/pencil.png"}
            width={50}
            height={50}
            alt="pencil"
          />
        </button>
        <button onClick={() => setTool("rectangle")}>
          <Image
            src={
              "https://img.icons8.com/carbon-copy/100/picture-in-picture.png"
            }
            width={50}
            height={50}
            alt="rectangle"
          />
        </button>
        <button onClick={() => setTool("line")}>
          <Image
            src={"https://img.icons8.com/carbon-copy/100/horizontal-line.png"}
            width={50}
            height={50}
            alt="line"
          />
        </button>
        <button onClick={() => setTool("circle")}>
          <Image
            src={"https://img.icons8.com/plasticine/100/unchecked-circle.png"}
            width={50}
            height={50}
            alt="circle"
          />
        </button>
        <button onClick={() => {}}>
          <Image
            src={"https://img.icons8.com/plasticine/100/delete-sign.png"}
            width={50}
            height={50}
            alt="eraser"
          />
        </button>
        <button onClick={() => setTool("text")}>
          <Image
            src={"https://img.icons8.com/plasticine/100/document.png"}
            width={50}
            height={50}
            alt="text"
          />
        </button>
      </div>
      <div className="absolute bg-slate-700 flex top-6 left-8 list-none gap-5 h-10 items-center p-3 rounded-xl">
        <input
          type="color"
          className="w-10 h-10 bg-transparent rounded-xl"
          onChange={(e) => setLineColor(e.target.value)}
        />
      </div>
      <canvas
        ref={canvasRef}
        width="2000"
        height="2000"
        style={{ backgroundColor: "transparent" }}
      ></canvas>
    </main>
  );
};

export default Canvas;
