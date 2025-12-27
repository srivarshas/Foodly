import MobileNav from "./MobileNav";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <MobileNav />
    </div>
  );
}
