import img1_des from "../assets/food1.webp";
import img2_des from "../assets/food2.webp";
import img3_des from "../assets/food3.webp";

import img1_client from "../assets/client-1.jpg";
import img2_client from "../assets/client-2.jpg";
import img3_client from "../assets/client-3.jpg";
import img4_client from "../assets/client-4.jpg";

export interface DestinationType {
  title: string;
  location: string;
  rating: number;
  image: string;
}

export const destinations: DestinationType[] = [
  {
    title: "Bún chả Hà Nội",
    location: "TP. Hà Nội",
    rating: 4.7,
    image: img1_des,
  },
  {
    title: "Nem cua bể Hải Phòng",
    location: "Hải Phòng",
    rating: 4.5,
    image: img2_des,
  },
  {
    title: "Bún bò Huế",
    location: "Huế",
    rating: 4.8,
    image: img3_des,
  },
];

export const clients = [
  {
    name: "John Adams",
    role: "Travel Blogger",
    image: img1_client,
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    name: "Emily",
    role: "Adventure Enthusiast",
    image: img2_client,
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    name: "Justine Morizt",
    role: "Chef",
    image: img3_client,
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    name: "Henry",
    role: "Doctor",
    image: img4_client,
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
];

export const VietNam_Provinces = [
  "An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn", "Bạc Liêu","Bắc Ninh","Bến Tre","Bình Định",
  "Bình Dương","Bình Phước","Bình Thuận","Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng","Đắk Lắk",
  "Đắk Nông","Điện Biên", "Đồng Nai","Đồng Tháp", "Gia Lai","Hà Giang","Hà Nam","Hà Nội",
  "Hà Tĩnh","Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa","Kiên Giang",
  "Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định",
  "Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ","Phú Yên","Quảng Bình","Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh","Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa",
  "Thừa Thiên Huế","Tiền Giang","TP Hồ Chí Minh","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái",
];
