import Canvas from "@/components/canvas/Canvas";
import React from "react";

const page = () => {
  return (
    <div className="h-full w-full bg-black  bg-grid-white/[0.03] relative flex items-center justify-center">
      <Canvas />
    </div>
  );
};

export default page;
