import React, { useState, useEffect } from "react";

export const HeroMiniViz: React.FC = () => {
  const [array, setArray] = useState([40, 20, 90, 55, 70, 15, 80]);
  const [compares, setCompares] = useState<number[]>([]);
  const [activeSort, setActiveSort] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let currentArr = [...array];
    let i = 0;
    let j = 0;

    const runLoop = () => {
      timer = setInterval(() => {
        if (i < currentArr.length - 1) {
          if (j < currentArr.length - i - 1) {
            setCompares([j, j + 1]);
            if (currentArr[j] > currentArr[j + 1]) {
              const temp = currentArr[j];
              currentArr[j] = currentArr[j + 1];
              currentArr[j + 1] = temp;
              setArray([...currentArr]);
            }
            j++;
          } else {
            j = 0;
            i++;
          }
        } else {
          // Reset array to original unsorted state in loop
          clearInterval(timer);
          setCompares([]);
          setTimeout(() => {
            currentArr = [40, 20, 90, 55, 70, 15, 80];
            setArray([...currentArr]);
            i = 0;
            j = 0;
            runLoop();
          }, 2000);
        }
      }, 300);
    };

    runLoop();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-end justify-center gap-1.5 h-20 w-36 px-3 py-2 bg-surface border border-borderColor rounded-xl shadow-inner select-none transition-colors duration-300">
      {array.map((val, idx) => {
        const isComparing = compares.includes(idx);
        const barHeight = `${Math.max(15, (val / 90) * 100)}%`;

        return (
          <div
            key={idx}
            style={{ height: barHeight }}
            className={`w-3.5 rounded-sm transition-all duration-300 ${
              isComparing ? "bg-accent" : "bg-primary"
            }`}
          />
        );
      })}
    </div>
  );
};
