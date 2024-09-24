"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { BorderWidthIcon, HamburgerMenuIcon, LineHeightIcon, Pencil1Icon, WidthIcon } from "@radix-ui/react-icons";
import { Circle, Eraser, Pencil, PenLine, RectangleEllipsis, Redo2, Undo, Undo2 } from "lucide-react";
import { ModeToggle } from "../ui/toggle";

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
  lineWidth: number;
};

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [tool, setTool] = useState<string>("pencil");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [undoStack, setUndoStack] = useState<Shape[][]>([]);
  const [redoStack, setRedoStack] = useState<Shape[][]>([]);
  const [lineWidth, setLineWidth] = useState(2);
  const [lineColor, setLineColor] = useState("#FFFFFF");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setIsMobile(window.innerWidth < 768);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawShape = (shape: Shape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;

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

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      const start = { x, y };
      setStartPoint(start);

      if (tool === "pencil") {
        setShapes((prevShapes) => {
          const newShapes = [
            ...prevShapes,
            { tool, points: [start], color: lineColor, lineWidth },
          ];
          setUndoStack((prevUndoStack) => [...prevUndoStack, prevShapes]);
          setRedoStack([]);
          return newShapes;
        });
      }
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      const current = { x, y };
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
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (tool !== "pencil" && startPoint && currentPoint) {
        setShapes((prevShapes) => {
          const newShapes = [
            ...prevShapes,
            {
              tool,
              startPoint,
              endPoint: currentPoint,
              color: lineColor,
              lineWidth,
            },
          ];
          setUndoStack((prevUndoStack) => [...prevUndoStack, prevShapes]);
          setRedoStack([]);
          return newShapes;
        });
      }
      setStartPoint(null);
      setCurrentPoint(null);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchmove", handleMouseMove);
    canvas.addEventListener("touchend", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchmove", handleMouseMove);
      canvas.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDrawing, startPoint, currentPoint, tool, shapes, lineColor, lineWidth]);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUndoStack((prevUndoStack) => [...prevUndoStack, shapes]);
    setRedoStack([]);
    setShapes([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevShapes = undoStack[undoStack.length - 1];
    setUndoStack((prevUndoStack) => prevUndoStack.slice(0, -1));
    setRedoStack((prevRedoStack) => [...prevRedoStack, shapes]);
    setShapes(prevShapes);
    redrawCanvas(prevShapes);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextShapes = redoStack[redoStack.length - 1];
    setRedoStack((prevRedoStack) => prevRedoStack.slice(0, -1));
    setUndoStack((prevUndoStack) => [...prevUndoStack, shapes]);
    setShapes(nextShapes);
    redrawCanvas(nextShapes);
  };

  const redrawCanvas = (shapesToDraw: Shape[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapesToDraw.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      if (shape.tool === "rectangle" && shape.startPoint && shape.endPoint) {
        const width = shape.endPoint.x - shape.startPoint.x;
        const height = shape.endPoint.y - shape.startPoint.y;
        ctx.beginPath();
        ctx.rect(shape.startPoint.x, shape.startPoint.y, width, height);
        ctx.stroke();
      } else if (shape.tool === "line" && shape.startPoint && shape.endPoint) {
        ctx.beginPath();
        ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        ctx.stroke();
      } else if (shape.tool === "circle" && shape.startPoint && shape.endPoint) {
        const radius = Math.sqrt(
          Math.pow(shape.endPoint.x - shape.startPoint.x, 2) + Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(shape.startPoint.x, shape.startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.tool === "pencil" && shape.points) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      }
    });
  };

  return (
    <main className="flex relative justify-center items-center overflow-hidden max-h-screen">
      <div className={`absolute  backdrop-blur-sm flex ${isMobile ? 'bottom-6 left-1/2 transform -translate-x-1/2' : 'top-6'} list-none gap-2 md:gap-5 h-16 items-center p-3 rounded-xl mb-10 shadow-lg flex-wrap justify-center`}>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("pencil")}>
          
          <Pencil/>
        </Button>
        <ModeToggle/>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0">
              
              <BorderWidthIcon/>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Line Width</h4>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[lineWidth]}
                  onValueChange={(value) => setLineWidth(value[0])}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("rectangle")}>
          
          <RectangleEllipsis/>
        </Button>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("line")}>
          
          <PenLine/>
        </Button>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("circle")}>
          
          <Circle/>
        </Button>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleClearCanvas}>
         
          <Eraser/>
        </Button>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleUndo}>
          
          <Undo2/>
        </Button>
        <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleRedo}>
          
          <Redo2/>
        </Button>
      </div>
      <div className={`absolute bg-slate-800/80 backdrop-blur-sm flex ${isMobile ? 'top-6 left-1/2 transform -translate-x-1/2' : 'top-6 left-8'} list-none gap-5 h-16 items-center p-3 rounded-xl shadow-lg`}>
        <input
          type="color"
          className="w-10 h-10 md:w-12 md:h-12 bg-transparent rounded-xl cursor-pointer"
          onChange={(e) => setLineColor(e.target.value)}
        />
      </div>
      
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="bg-transparent cursor-crosshair touch-none"
      ></canvas>
    </main>
  );
};

export default Canvas;
