import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import {
  Flame,
  Factory,
  Compass,
  Activity,
  MousePointerClick
} from 'lucide-react';


const TYPE_INFO = {
  0: {
    name: 'Vegetation / Wildfire',
    color: '#10b981',
    icon: Flame
  },

  2: {
    name: 'Industrial Heat Source',
    color: '#f59e0b',
    icon: Factory
  },

  3: {
    name: 'Other / Offshore',
    color: '#06b6d4',
    icon: Compass
  }
};


export default function TypeBreakdownChart({
  byType,
  onTypeSelect
}) {

  if (!byType) {
    return null;
  }


  const data = [0, 2, 3]
    .map(type => ({
      type,
      name: TYPE_INFO[type].name,
      value: Number(byType[String(type)] || 0),
      color: TYPE_INFO[type].color
    }))
    .filter(item => item.value > 0);


  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );


  /*
   * THIS FUNCTION IS THE IMPORTANT PART.
   *
   * When the user clicks a type,
   * App.jsx receives the type number.
   */
  const handleTypeClick = (type) => {

    console.log(
      'TYPE CLICKED FROM ANALYTICS:',
      type
    );

    if (onTypeSelect) {
      onTypeSelect(type);
    }

  };


  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div className="flex items-center space-x-2">

          <Activity className="w-4 h-4 text-amber-400" />

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Heat Source Class Breakdown
          </h3>

        </div>

        <span className="text-xs text-slate-400 font-mono">
          {total.toLocaleString()} Total
        </span>

      </div>


      {/* =====================================================
          PIE CHART
      ===================================================== */}

      <div className="h-64 w-full">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"

              /*
               * Clicking a PIE SEGMENT
               */
              onClick={(entry) => {

                if (entry && entry.type !== undefined) {

                  handleTypeClick(entry.type);

                }

              }}

              cursor="pointer"
            >

              {data.map((entry) => (

                <Cell
                  key={`cell-${entry.type}`}
                  fill={entry.color}
                  stroke="#0b0f17"
                  strokeWidth={2}
                />

              ))}

            </Pie>


            <Tooltip
              contentStyle={{
                backgroundColor:
                  'rgba(15, 23, 42, 0.95)',

                borderColor:
                  'rgba(245, 158, 11, 0.3)',

                borderRadius:
                  '0.75rem',

                color:
                  '#f8fafc',

                fontSize:
                  '12px'
              }}

              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name
              ]}

            />


            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: '11px',
                paddingTop: '10px'
              }}
            />

          </PieChart>

        </ResponsiveContainer>

      </div>


      {/* =====================================================
          CLICKABLE TYPE CARDS
      ===================================================== */}

      <div className="space-y-2">

        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500">

          <MousePointerClick className="w-3 h-3" />

          <span>
            Click a source type to view it on the Spatial Map
          </span>

        </div>


        {data.map((item) => {

          const percentage =
            total > 0
              ? ((item.value / total) * 100).toFixed(1)
              : '0.0';


          const Icon =
            TYPE_INFO[item.type].icon;


          return (

            <button
              key={item.type}

              type="button"

              onClick={() => {
                console.log(
                  'CLICKED TYPE CARD:',
                  item.type
                );

                handleTypeClick(item.type);
              }}

              className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800 hover:border-amber-500/50 transition-all duration-200 cursor-pointer"
            >

              <div className="flex items-center justify-between">


                {/* LEFT */}

                <div className="flex items-center space-x-3">

                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor:
                        `${item.color}20`
                    }}
                  >

                    <Icon
                      className="w-5 h-5"
                      style={{
                        color:
                          item.color
                      }}
                    />

                  </div>


                  <div>

                    <div className="text-sm font-semibold text-slate-200">

                      {item.name}

                    </div>

                    <div className="text-[10px] text-slate-500">

                      Type {item.type}

                    </div>

                  </div>

                </div>


                {/* RIGHT */}

                <div className="text-right">

                  <div
                    className="text-lg font-black"
                    style={{
                      color:
                        item.color
                    }}
                  >

                    {item.value.toLocaleString()}

                  </div>

                  <div className="text-[10px] text-slate-500">

                    {percentage}%

                  </div>

                </div>

              </div>


              {/* PROGRESS BAR */}

              <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className="h-full rounded-full"
                  style={{
                    width:
                      `${percentage}%`,

                    backgroundColor:
                      item.color
                  }}
                />

              </div>


              {/* CLICK HINT */}

              <div className="mt-2 text-[10px] text-slate-600">

                Click to view on Spatial Map →

              </div>

            </button>

          );

        })}

      </div>

    </div>
  );
}