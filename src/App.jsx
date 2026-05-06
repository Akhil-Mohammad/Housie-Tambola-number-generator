import React from "react";

export default function HousieGenerator() {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  const [generated, setGenerated] = React.useState([]);
  const [current, setCurrent] = React.useState(null);

  const generateNumber = () => {
    const remaining = numbers.filter((n) => !generated.includes(n));

    if (remaining.length === 0) {
      alert("All numbers are generated!");
      return;
    }

    const random =
      remaining[Math.floor(Math.random() * remaining.length)];

    setCurrent(random);
    setGenerated((prev) => [...prev, random]);
  };

  const resetGame = () => {
    setGenerated([]);
    setCurrent(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-start">
      <div className="flex gap-8 w-full max-w-7xl">

        {/* LEFT PANEL */}
        <div className="bg-white rounded-3xl shadow-xl p-6 w-80 text-center h-fit">

          <h1 className="text-3xl font-bold mb-6">
            Housie Generator
          </h1>

          <div className="mb-6">
            <p className="text-lg text-gray-500 mb-3">
              Current Number
            </p>

            <div className="w-40 h-40 mx-auto rounded-full bg-blue-500 text-white flex items-center justify-center text-6xl font-bold shadow-lg">
              {current ?? "--"}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={generateNumber}
              className="px-6 py-3 rounded-2xl bg-green-600 text-white text-lg font-semibold hover:scale-105 transition"
            >
              Generate Number
            </button>

            <button
              onClick={resetGame}
              className="px-6 py-3 rounded-2xl bg-red-500 text-white text-lg font-semibold hover:scale-105 transition"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 text-gray-500 font-medium">
            Numbers Generated: {generated.length} / 90
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white rounded-3xl shadow-xl p-6 flex-1">

          <h2 className="text-3xl font-bold mb-6 text-center">
            All Numbers
          </h2>

          <div className="grid grid-cols-10 gap-2 justify-items-center">
            {numbers.map((num) => {
              const isCalled = generated.includes(num);

              return (
                <div
                  key={num}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow transition ${
                    isCalled
                      ? "bg-blue-500 text-white scale-105"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}