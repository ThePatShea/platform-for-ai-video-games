import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import InstallationToast from "@/components/toast";
import { WindowAI, getWindowAI } from "window.ai";
import Image from "next/image";
import Link from "next/link";

import FeaturedSlider from "../components/FeaturedSlider";

const App: React.FC = () => {
  const aiRef = useRef<WindowAI | null>(null);

  const games = useSelector((state) => state.global.games);
  const users = useSelector((state) => state.global.users);

  useEffect(() => {
    const init = async () => {
      aiRef.current = await getWindowAI();
      if (!aiRef.current) {
        toast.custom(<InstallationToast />, {
          id: "window-ai-not-detected",
        });
      }
    };
    init();
  }, []);

  const featuredAmount = 4;

  const featuredGames = games.slice(0, featuredAmount);
  const unfeaturedGames = games.slice(featuredAmount, games.length);

  const timeframe: String[] = ["days", "weeks", "months"];

  return (
    <div className="min-h-screen flex justify-center pt-20 pb-4 px-4">
      <div>
        <FeaturedSlider games={featuredGames} />
        <div className="mt-6 text-2xl font-light border-solid border-t border-b border-gray-300 text-gray-700">
          Recommended For You
        </div>
        <div className="pt-4 grid grid-cols-4 gap-4">
          {unfeaturedGames.map((game, index) => (
            <Link href={`/play/${game.id}`} key={index}>
              <div className="relative rounded-lg overflow-hidden shadow-lg active:shadow-none hover:opacity-80 transition-all">
                <Image
                  src={game.image}
                  width={256}
                  height={150}
                  alt={`Game image for ${game.name}`}
                  className="rounded-lg overflow-hidden"
                />
                <div className="flex flex-col items-center absolute bottom-3 align-center bg-black/[0.6] w-full">
                  <div className="text-gray-100 text-xl font-light">
                    {game.name}
                  </div>
                </div>
              </div>
              <div className="flex mt-2 mb-4 items-center">
                <Image
                  src={`/users/${game.creatorId}.png`}
                  width={50}
                  height={50}
                  alt="Game Image"
                  className="rounded-3xl"
                />
                <div className="ml-2">
                  <div className="font-semibold">
                    {users[game.creatorId].username}
                  </div>
                  <div className="font-light text-sm">
                    {game.plays} Plays • {game.date}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;
