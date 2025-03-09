import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  games: string[];
}

const FeaturedSlider: React.FC<Props> = ({ games }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 3000); // Change slide every few seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [games]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? games.length - 1 : prev - 1));
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden shadow-lg active:shadow-none w-full"
      style={{ height: "450px" }}
    >
      <div className="hover:opacity-80 transition-all">
        <Link href={`/play/${games[currentIndex].id}`}>
          {games.map((game, index) => (
            <div
              key={index}
              className={`absolute w-full bg-center bg-cover transition-opacity duration-300 ${
                currentIndex === index ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${game.image})`, height: "450px" }}
            >
              <div className="flex flex-col items-center absolute bottom-10 align-center bg-black/[.6] w-full p-4">
                <div className="text-gray-100 text-4xl font-light">
                  {game.name}
                </div>
              </div>
            </div>
          ))}
        </Link>
      </div>
      <button
        className="absolute top-1/2 left-0 py-4 pl-3 pr-4 bg-black bg-opacity-40 hover:bg-opacity-80 transition-all text-white text-2xl font-light rounded-tr-lg rounded-br-lg"
        onClick={prevSlide}
      >
        <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 7.5,12.5 L 17.5,2.5 L 17.5,22.5 L 7.5,12.5 Z"
            fill="white"
          />
        </svg>
      </button>
      <button
        className="absolute top-1/2 right-0 py-4 pl-4 pr-3 bg-black bg-opacity-40 hover:bg-opacity-80 transition-all text-white text-2xl font-light rounded-tl-lg rounded-bl-lg"
        onClick={nextSlide}
      >
        <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 17.5,12.5 L 7.5,2.5 L 7.5,22.5 L 17.5,12.5 Z"
            fill="white"
          />
        </svg>
      </button>
    </div>
  );
};

export default FeaturedSlider;
