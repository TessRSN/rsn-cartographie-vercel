export default function HorizontalNavbar() {
  return (
    <nav className="flex flex-row navbar bg-base-100 shadow-lg">
      <div className="flex-none">
        <img className="" src="/L_RSN_FR_RGB_W-400x145.png" width={120} />
      </div>
      <div className="flex-1 px-4">
        <a className="btn btn-ghost text-xl">Cartographie</a>
      </div>
      <div className="flex-1 flex flex-row gap-8 px-4">
        <a href="#home" className="link link-hover">
          Home
        </a>
        <a href="#about" className="link link-hover">
          About
        </a>
        <a href="#services" className="link link-hover">
          Services
        </a>
        <a href="#contact" className="link link-hover">
          Contact
        </a>
      </div>
      <div className="flex-none gap-4 flex flex-row items-center">
        <input
          type="text"
          placeholder="Search..."
          className="input input-bordered input-sm w-32"
        />
      </div>
    </nav>
  );
}
