import { HeroScroll } from "@/components/scrollPage";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col">
    <div className="h-[50rem] w-full dark:bg-black bg-white  dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="flex flex-col justify-center items-center">
        <p className="scroll-m-20 text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 ">
          Collaborative WhiteBoard
        </p>
        <p className="pl-4 text-4xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-8">
          Dizo ✏️
        </p>
        <Button className="bg-gray-500">
        <Link className=" text-xl" href={"/dashboard"}>Lets Draw</Link>
        </Button>
      </div>
    </div>
    <HeroScroll/>
    </div>
  );
}
