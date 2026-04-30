type Props = {
  images: string[];
  current: number;
};

export default function ImageSlider({ images, current }: Props) {
  return (
    <div className="absolute inset-0 z-0">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}