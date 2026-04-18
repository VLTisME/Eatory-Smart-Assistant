export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-100 mt-10 p-10">
      {/* Thay grid thành flex và thêm justify-between */}
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
  {/* Cột 1 mặc định nằm bên trái */}
<div className="flex flex-col">
  <h2 className="text-2xl font-bold">Web Travel</h2>
  <p className="max-w-md text-gray-600 mt-4">
    Exploring the nation's culinary has never been easier. Let our AI Assistant design your perfect food journey in seconds.
  </p>
</div>

  {/* Cột 2 dùng justify-self-end để đẩy về bên phải */}
<div className="md:text-left"> {/* Giúp dời toàn bộ khối này sang trái một chút */}
  <h4 className="font-bold text-lg mb-2">Contact Us</h4>
<div className="space-y-3 text-gray-500">
  <div className="flex items-center gap-2">
    <i className="ri-phone-fill text-gray"></i>
    <p>+84 9876543210</p>
  </div>

  <div className="flex items-center gap-2">
    <i className="ri-record-mail-line text-gray"></i>
    <p>info@webtravel</p>
  </div>

  <div className="flex items-center gap-2">
    <i className="ri-map-pin-2-fill text-gray"></i>
    <p>HCM City, VietNam</p>
  </div>
</div>
</div>
</div>
    </footer>
  );
}