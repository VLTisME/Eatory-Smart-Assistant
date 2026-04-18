import { RiRestaurant2Fill  , RiServiceBellLine  , RiTreasureMapLine  } from "react-icons/ri";

const data = [
  {
    title: "Foodie Hotspots",
    icon: <RiRestaurant2Fill  />,
    desc: "Tìm kiếm những quán ăn ẩn mình hay các nhà hàng nổi tiếng nhất được đề xuất dựa trên sở thích cá nhân."
  },
  {
    title: "Authentic Delicacies",
    icon: <RiServiceBellLine />,
    desc: "Khám phá những món ăn đặc sản tinh túy, mang đậm linh hồn và câu chuyện của từng vùng đất bạn đặt chân đến."
  },
  {
    title: "Cultural Stories",
    icon: <RiTreasureMapLine  />,
    desc: "Tìm hiểu về lịch sử và cách chế biến đằng sau mỗi món ăn thông qua những trải nghiệm cùng người bản xứ."
  }
];

export default function Discover() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h2 className="text-4xl font-bold text-gray-900">
        Savor The Nation's Best Flavors
      </h2>

      <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
        Explore authentic local tastes with our intelligent culinary guide
      </p>

      <div className="grid gap-8 mt-14 md:grid-cols-2 lg:grid-cols-3">
        {data.map((d, i) => (
          <div
            key={i}
            className="p-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-3xl mb-5">
              {d.icon}
            </div>

            <h4 className="font-bold text-xl text-gray-900 mb-3">
              {d.title}
            </h4>

            <p className="text-gray-500 leading-7">
              {d.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

