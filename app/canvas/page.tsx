"use client";
import Canvas from "@/components/canvas/Canvas";
import React, { Suspense } from "react";

const page = () => {
  return (
    <div className="h-full w-full bg-black  bg-grid-white/[0.03] relative flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas />
      </Suspense>
    </div>
  );
};

export default page;
