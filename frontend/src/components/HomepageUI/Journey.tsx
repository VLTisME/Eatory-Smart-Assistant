import { RiRobotLine, RiRouteLine, RiBookReadLine } from "react-icons/ri";

const items = [
  {
    icon: <RiRobotLine />,
    title: "AI Chatbot Thông minh",
    desc: "Hỏi đáp và tìm kiếm quán ăn yêu thích ngay lập tức thông qua trợ lý ảo hỗ trợ 24/7.",
  },
  {
    icon: <RiRouteLine />,
    title: "Hành trình của riêng bạn",
    desc: "Tự động tạo lộ trình khám phá các món ngon theo đúng khẩu vị và thời gian của bạn.",
  },
  {
    icon: <RiBookReadLine />,
    title: "Đánh giá chân thực",
    desc: "Cập nhật những nhận xét và phân tích cảm xúc mới nhất về chất lượng món ăn tại điểm đến.",
  },
];

export default function Journey() {
  return (
    <section id="tour" className="max-w-6xl mx-auto p-10">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-center">
          Smart Dining Made Simple!
        </h2>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Effortless Food Planning for Your Next Adventure with AI Technology
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {items.map((i, idx) => (
          <div
            key={idx}
            className="bg-gray-100 p-6 rounded-xl shadow-sm hover:shadow-lg transition"
          >
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-[#2887ff] text-2xl mb-4">
              {i.icon}
            </span>
            <h4 className="font-bold text-xl mb-2">{i.title}</h4>
            <p className="text-gray-600">{i.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
