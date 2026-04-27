//src/components/Auth/LeftPanel.tsx
export default function LeftPanel() {
  return (
    <div className="w-[58%] p-16 flex flex-col justify-between text-white">

      {/* Nội dung */}
      <div className="relative z-20">
        <h2 className="text-4xl font-bold leading-tight">
          Welcome!
          <br />
          <span className="text-2xl font-medium">
            To our Website.
          </span>
        </h2>
      </div>
    </div>
  );
}