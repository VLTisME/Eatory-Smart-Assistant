import { destinations } from "../../data/travelData";
import { RiStarFill } from "react-icons/ri";
export default function Destination() {
  return (
    <section id="about" className="max-w-6xl mx-auto p-10 bg-white">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Top Foods
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          Explore the most delicous dishes around the our country!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {destinations.map((d, i) => (
          <div
            key={i}
            className="flex flex-col bg-white rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all duration-300"
          >
            <div className="h-48 w-full overflow-hidden rounded-[24px]">
              <img
                src={d.image}
                className="w-full h-full object-cover"
                alt={d.title}
              />
            </div>

            <div className="p-8 pb-10 flex justify-between items-start gap-4">
              <div className="flex-grow">
                <h4 className="text-lg font-semibold ">{d.title}</h4>
                <p className=" text-gray-600 ">{d.location}</p>
              </div>

              <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                <RiStarFill className="text-sm" />
                <span>{d.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
