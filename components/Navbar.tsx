import Link from "next/link";

export default function Navbar() {
  return (
    <div className="bg-blue-700 text-2xl p-3 flex justify-between shadow-xl fixed w-full fixed z-50 top-0">
      <Link href="/">
        <div className="font-light text-gray-50 select-none hover:opacity-80 transition-all">
          Boundless Arcade
        </div>
      </Link>
      <Link href="/create">
        <svg
          width="30"
          height="30"
          xmlns="http://www.w3.org/2000/svg"
          className="hover:opacity-80 shadow-lg active:shadow-none transition-all"
        >
          <circle cx="15" cy="15" r="15" fill="white" />
          <rect
            x="13.5"
            y="7"
            width="3"
            height="16"
            fill="rgb(29, 78, 216)"
            stroke="transparent"
            strokeWidth="1.5"
          />
          <rect
            x="7"
            y="13.5"
            width="16"
            height="3"
            fill="rgb(29, 78, 216)"
            stroke="transparent"
            strokeWidth="1.5"
          />
        </svg>
      </Link>
    </div>
  );
}
