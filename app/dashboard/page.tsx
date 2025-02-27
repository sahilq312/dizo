"use client";

import { JoinForm } from "@/components/ui/joinButton";
import { ModeToggle } from "@/components/ui/toggle";
import { TypewriterEffectSmooth } from "@/components/ui/typeWritter";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const page = () => {
  const words = [
    {
      text: "Draw",
    },
    {
      text: "your",
    },
    {
      text: "Ideas",
    },
    {
      text: "With",
    },
    {
      text: "DIZO.",
      className: "text-blue-500 dark:text-blue-500",
    },
  ];
  return (
    <div className="">
      <nav className="flex gap-6 h-10 justify-center items-center list-none pt-10">
        <li>Docs</li>
        <li>
          <ModeToggle />
        </li>
      </nav>
     
      <div className="flex flex-col items-center justify-center h-[40rem] mt-15 gap-4 ">
        <TypewriterEffectSmooth words={words} />
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
          <Link
            href={"/canvas"}
            className=" flex  justify-center items-center w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-md"
          >
            Create Room
          </Link>
          <Link
            href={"/offline"}
            className=" flex  justify-center items-center w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-md"
          >
            Offline Mode
          </Link>
          {/* <JoinForm /> */}
        </div>
        <div className="bg-yellow-200 border-yellow-800 p-2 w-1/3 flex justify-center rounded-xl">
          <p className="text-yellow-800 text-xs sm:text-base  flex items-center gap-1">
            <ExclamationTriangleIcon className="w-10"/> To use collaborative whiteboard will work on locally as server is not deployed 
          </p>
        </div>
      </div>
    </div>
  );
};
export default page;
