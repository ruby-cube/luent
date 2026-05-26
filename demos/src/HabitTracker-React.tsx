import { useState } from "react";

type HabitTrackerProps = {
  habit: string;
  goal: number;
};

export function HabitTrackerReact({ habit, goal }: HabitTrackerProps) {
  const [count, setCount] = useState(0);
  const [hoverCount, setHoverCount] = useState(0);
  const [hovering, setHovering] = useState(false);

  const achieved = count === goal;

  return (
    <div>
      {habit}
      <ul
        className="habit-tracker"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {Array.from({ length: goal }, (_, i) => {
          const n = i + 1;
          const filled = hovering ? n <= hoverCount : n <= count;

          return (
            <li
              key={n}
              className={`unit ${filled ? " filled" : ""}`}
              onMouseOver={() => setHoverCount(n)}
              onClick={() => setCount(n)}
            ></li>
          );
        })}
        {achieved && <li className="achieved-star">🌟</li>}
      </ul>

      <style>{`
        ul.habit-tracker {
          display: inline-flex;
          gap: 0.25rem;
          margin: 0 0 0 0.5rem;
          padding: 0;
          list-style-type: none;
          vertical-align: middle;
        }

        li {
          width: 0.85rem;
          height: 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          background-color: transparent;
          box-sizing: border-box;
          text-align: center;
        }

        li.unit {
          border: 1px solid currentColor;
          border-radius: 50%;
          transition: background-color 0.15s ease;
        }

        li.filled {
          background-color: currentColor;
        }

        li.achieved-star {
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
