"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { BorderWidthIcon } from "@radix-ui/react-icons";
import { Circle, Eraser, Pencil, PenLine, RectangleEllipsis, Redo2, Undo, Undo2, Share2, Users } from "lucide-react";
import { ModeToggle } from "../ui/toggle";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Point = {
  x: number;
  y: number;
};

type Shape = {
  id: string;
  tool: string;
  startPoint?: Point;
  endPoint?: Point;
  points?: Point[];
  color: string;
  lineWidth: number;
  userId: string;
};

type User = {
  id: string;
  color: string;
  name: string;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [joinRoomId, setJoinRoomId] = useState<string>("");
  const [joinName, setJoinName] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize socket connection and handle URL params
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam) {
      setJoinRoomId(roomParam);
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001");
    setSocket(socketInstance);
    
    setUserId(uuidv4());

    return () => {
      socketInstance.disconnect();
    };
  }, [searchParams]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("roomJoined", (data: { roomId: string, users: User[] }) => {
      setRoomId(data.roomId);
      setConnectedUsers(data.users);
      setIsConnected(true);
      
      toast("Connected to Room",{
        description: `You've joined room: ${data.roomId}`,
      });
    });

    socket.on("userJoined", (data: { user: User, users: User[] }) => {
      setConnectedUsers(data.users);
      
      toast("User Joined",{
        description: `${data.user.name} has joined the room`,
      });
    });

    socket.on("userLeft", (data: { userId: string, users: User[] }) => {
      setConnectedUsers(data.users);
    });

    socket.on("initialShapes", (initialShapes: Shape[]) => {
      setShapes(initialShapes);
      redrawCanvas(initialShapes);
    });

    socket.on("drawShape", (shape: Shape) => {
      setShapes((prevShapes) => {
        const newShapes = [...prevShapes, shape];
        redrawCanvas(newShapes);
        return newShapes;
      });
    });

    socket.on("updateShape", (updatedShape: Shape) => {
      setShapes((prevShapes) => {
        const shapeIndex = prevShapes.findIndex(shape => shape.id === updatedShape.id);
        if (shapeIndex === -1) return prevShapes;
        
        const newShapes = [...prevShapes];
        newShapes[shapeIndex] = updatedShape;
        redrawCanvas(newShapes);
        return newShapes;
      });
    });

    socket.on("clearCanvas", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setShapes([]);
    });

    return () => {
      socket.off("connect");
      socket.off("roomJoined");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("initialShapes");
      socket.off("drawShape");
      socket.off("updateShape");
      socket.off("clearCanvas");
    };
  }, [socket, toast]);

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

    // Initial canvas draw
    redrawCanvas(shapes);

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      if (!isConnected) return;
      
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      const start = { x, y };
      setStartPoint(start);

      if (tool === "pencil") {
        const newShape: Shape = { 
          id: uuidv4(), 
          tool, 
          points: [start], 
          color: lineColor, 
          lineWidth,
          userId 
        };
        
        setShapes((prevShapes) => {
          const newShapes = [...prevShapes, newShape];
          setUndoStack((prevUndoStack) => [...prevUndoStack, prevShapes]);
          setRedoStack([]);
          return newShapes;
        });
        
        if (socket) {
          socket.emit("drawShape", { roomId, shape: newShape });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || !isConnected) return;
      
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
            
            if (socket) {
              socket.emit("updateShape", { roomId, shape: lastShape });
            }
          }
          return updatedShapes;
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawCanvas(shapes);
      
      // Draw current shape
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      
      if (tool === "rectangle" && startPoint) {
        drawRectangle(ctx, startPoint, current);
      } else if (tool === "line" && startPoint) {
        drawLine(ctx, startPoint, current);
      } else if (tool === "circle" && startPoint) {
        drawCircle(ctx, startPoint, current);
      }
    };

    const handleMouseUp = () => {
      if (!isDrawing || !isConnected) return;
      setIsDrawing(false);

      if (tool !== "pencil" && startPoint && currentPoint) {
        const newShape: Shape = {
          id: uuidv4(),
          tool,
          startPoint,
          endPoint: currentPoint,
          color: lineColor,
          lineWidth,
          userId
        };
        
        setShapes((prevShapes) => {
          const newShapes = [...prevShapes, newShape];
          setUndoStack((prevUndoStack) => [...prevUndoStack, prevShapes]);
          setRedoStack([]);
          return newShapes;
        });
        
        if (socket) {
          socket.emit("drawShape", { roomId, shape: newShape });
        }
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
  }, [isDrawing, startPoint, currentPoint, tool, shapes, lineColor, lineWidth, socket, roomId, isConnected, userId]);

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

  const handleClearCanvas = () => {
    if (!isConnected) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUndoStack((prevUndoStack) => [...prevUndoStack, shapes]);
    setRedoStack([]);
    setShapes([]);
    
    if (socket) {
      socket.emit("clearCanvas", { roomId });
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !isConnected) return;
    const prevShapes = undoStack[undoStack.length - 1];
    setUndoStack((prevUndoStack) => prevUndoStack.slice(0, -1));
    setRedoStack((prevRedoStack) => [...prevRedoStack, shapes]);
    setShapes(prevShapes);
    redrawCanvas(prevShapes);
    
    // We don't sync undo/redo operations through sockets for simplicity
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !isConnected) return;
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
        drawRectangle(ctx, shape.startPoint, shape.endPoint);
      } else if (shape.tool === "line" && shape.startPoint && shape.endPoint) {
        drawLine(ctx, shape.startPoint, shape.endPoint);
      } else if (shape.tool === "circle" && shape.startPoint && shape.endPoint) {
        drawCircle(ctx, shape.startPoint, shape.endPoint);
      } else if (shape.tool === "pencil" && shape.points) {
        drawPencil(ctx, shape.points);
      }
    });
  };

  const createRoom = () => {
    if (!socket || !userName.trim()) return;
    
    const newRoomId = uuidv4().substring(0, 8);
    const userColor = getRandomColor();
    
    socket.emit("createRoom", { 
      roomId: newRoomId, 
      userId, 
      userName, 
      userColor 
    });
    
    setLineColor(userColor);
    setShowShareDialog(true);
  };

  const joinRoom = () => {
    if (!socket || !joinRoomId.trim() || !joinName.trim()) return;
    
    const userColor = getRandomColor();
    
    socket.emit("joinRoom", { 
      roomId: joinRoomId, 
      userId, 
      userName: joinName, 
      userColor 
    });
    
    setLineColor(userColor);
    setUserName(joinName);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast( "Link Copied!",{
      description: "Share this link with friends to collaborate",
    });
  };

  return (
    <main className="flex relative justify-center items-center overflow-hidden max-h-screen">
      {!isConnected ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border border-slate-500 p-6 rounded-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Collaborative Whiteboard</h2>
            
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">Create a New Room</h3>
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input 
                  id="userName" 
                  placeholder="Enter your name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                />
              </div>
              <Button className="w-full" onClick={createRoom}>Create Room</Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Join Existing Room</h3>
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input 
                  id="roomId" 
                  placeholder="Enter room ID" 
                  value={joinRoomId} 
                  onChange={(e) => setJoinRoomId(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinName">Your Name</Label>
                <Input 
                  id="joinName" 
                  placeholder="Enter your name" 
                  value={joinName} 
                  onChange={(e) => setJoinName(e.target.value)} 
                />
              </div>
              <Button className="w-full" onClick={joinRoom}>Join Room</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`absolute backdrop-blur-sm flex ${isMobile ? 'bottom-6 left-1/2 transform -translate-x-1/2' : 'top-6'} list-none gap-2 md:gap-3 h-16 items-center p-3 rounded-xl mb-10 shadow-lg flex-wrap justify-center z-10`}>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("pencil")}>
              <Pencil />
            </Button>
            <ModeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0">
                  <BorderWidthIcon />
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
              <RectangleEllipsis />
            </Button>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("line")}>
              <PenLine />
            </Button>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={() => setTool("circle")}>
              <Circle />
            </Button>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleClearCanvas}>
              <Eraser />
            </Button>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleUndo}>
              <Undo2 />
            </Button>
            <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0" onClick={handleRedo}>
              <Redo2 />
            </Button>
          </div>
          
          <div className={`absolute backdrop-blur-sm flex ${isMobile ? 'top-6 left-1/2 transform -translate-x-1/2' : 'top-6 left-8'} list-none gap-3 h-16 items-center p-3 rounded-xl shadow-lg z-10`}>
            <input
              type="color"
              className="w-10 h-10 md:w-12 md:h-12 bg-transparent rounded-xl cursor-pointer"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
            />
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0">
                  <Share2 />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Whiteboard</DialogTitle>
                  <DialogDescription>
                    Share this link with others to collaborate on this whiteboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={`${window.location.origin}?room=${roomId}`} 
                    readOnly 
                  />
                  <Button onClick={copyRoomLink}>Copy</Button>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Room ID: {roomId}</h4>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowShareDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-10 h-10 md:w-12 md:h-12 p-0">
                  <Users />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <h3 className="font-medium mb-2">Connected Users ({connectedUsers.length})</h3>
                <div className="space-y-2">
                  {connectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: user.color }}
                      ></div>
                      <span>{user.name} {user.id === userId ? "(You)" : ""}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="bg-transparent cursor-crosshair touch-none"
          ></canvas>
        </>
      )}
    </main>
  );
};

export default Canvas;